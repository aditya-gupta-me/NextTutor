"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/* ─────────────── helpers ─────────────── */

async function getSessionAndValidate(
    sessionId: string,
    role: "tutor" | "student",
    allowedStatuses: string[]
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get the user's profile
    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== role) throw new Error(`Only ${role}s can perform this action`);

    // Get profile id
    const table = role === "tutor" ? "tutor_profiles" : "student_profiles";
    const { data: profileData } = await supabase
        .from(table)
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profileData) throw new Error("Profile not found");

    // Get session & validate ownership
    const { data: session } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

    if (!session) throw new Error("Session not found");

    const ownerField = role === "tutor" ? "tutor_profile_id" : "student_profile_id";
    if (session[ownerField] !== profileData.id) throw new Error("Not authorized");

    if (!allowedStatuses.includes(session.status)) {
        throw new Error(`Cannot perform this action on a session with status "${session.status}"`);
    }

    return { supabase, session };
}

async function updateSessionStatus(sessionId: string, status: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("sessions")
        .update({ status })
        .eq("id", sessionId);

    if (error) throw new Error(`Failed to update session: ${error.message}`);
    revalidatePath("/sessions");
    revalidatePath(`/sessions/${sessionId}`);
}

/* ─────────────── actions ─────────────── */

/** Tutor accepts a requested session */
export async function acceptSession(sessionId: string) {
    await getSessionAndValidate(sessionId, "tutor", ["requested"]);
    await updateSessionStatus(sessionId, "accepted");
    return { success: true };
}

/** Tutor declines a requested session */
export async function declineSession(sessionId: string) {
    await getSessionAndValidate(sessionId, "tutor", ["requested"]);
    await updateSessionStatus(sessionId, "declined");
    return { success: true };
}

/** Tutor starts an accepted session */
export async function startSession(sessionId: string) {
    await getSessionAndValidate(sessionId, "tutor", ["accepted"]);
    await updateSessionStatus(sessionId, "active");
    return { success: true };
}

/** Tutor completes an active session */
export async function completeSession(sessionId: string) {
    await getSessionAndValidate(sessionId, "tutor", ["active"]);
    await updateSessionStatus(sessionId, "completed");
    return { success: true };
}

/** Either party cancels (only from requested or accepted) */
export async function cancelSession(sessionId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role as "tutor" | "student";
    await getSessionAndValidate(sessionId, role, ["requested", "accepted"]);
    await updateSessionStatus(sessionId, "cancelled");
    return { success: true };
}

/* ─────────────── reviews ─────────────── */

import { validateReviewComment } from "@/lib/profanity";

/** Student submits a review for a completed session */
export async function submitReview(
    sessionId: string,
    rating: number,
    comment: string
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
    }

    // Profanity check
    const commentError = await validateReviewComment(comment);
    if (commentError) throw new Error(commentError);

    // Must be student
    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "student") throw new Error("Only students can submit reviews.");

    // Get student profile
    const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!studentProfile) throw new Error("Student profile not found.");

    // Get session & validate
    const { data: session } = await supabase
        .from("sessions")
        .select("*, tutor_profiles!inner(slug)")
        .eq("id", sessionId)
        .single();

    if (!session) throw new Error("Session not found.");
    if (session.status !== "completed") throw new Error("You can only review completed sessions.");
    if (session.student_profile_id !== studentProfile.id) throw new Error("Not authorized.");

    // Check for existing review
    const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("session_id", sessionId)
        .eq("student_profile_id", studentProfile.id)
        .maybeSingle();

    if (existing) throw new Error("You have already reviewed this session.");

    // Insert review
    const { error: insertError } = await supabase.from("reviews").insert({
        session_id: sessionId,
        student_profile_id: studentProfile.id,
        tutor_profile_id: session.tutor_profile_id,
        rating,
        comment: comment.trim(),
    });

    if (insertError) throw new Error(`Failed to submit review: ${insertError.message}`);

    // Revalidate
    revalidatePath(`/sessions/${sessionId}`);
    const tutorData = session.tutor_profiles as unknown as { slug: string };
    if (tutorData?.slug) {
        revalidatePath(`/tutors/${tutorData.slug}`);
    }
    revalidatePath("/dashboard");

    return { success: true };
}

/** Toggle helpful (like) on a review */
export async function toggleHelpful(reviewId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if already liked
    const { data: existing } = await supabase
        .from("review_likes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existing) {
        // Unlike
        await supabase.from("review_likes").delete().eq("id", existing.id);
    } else {
        // Like
        const { error } = await supabase.from("review_likes").insert({
            review_id: reviewId,
            user_id: user.id,
        });
        if (error) throw new Error("Failed to mark as helpful.");
    }

    return { success: true, liked: !existing };
}
