import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the magic link redirect from Supabase email auth.
 * Exchanges the code for a session, checks if the user has completed
 * onboarding, and redirects accordingly.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                // Check if user has completed onboarding
                const { data: profile } = await supabase
                    .from("users")
                    .select("full_name, role")
                    .eq("id", user.id)
                    .maybeSingle();

                // No profile or empty name → send to onboarding
                if (!profile?.full_name || profile.full_name.trim() === "") {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }

                // Tutor profile completeness gate — check if essential fields are filled
                if (profile.role === "tutor") {
                    const { data: tutorProfile } = await supabase
                        .from("tutor_profiles")
                        .select("subjects, city, location, fee_per_month, fee_per_session")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    const hasSubjects = tutorProfile?.subjects?.length > 0;
                    const hasCity = !!tutorProfile?.city;
                    const hasLocation = !!tutorProfile?.location;
                    const hasFee = !!(tutorProfile?.fee_per_month || tutorProfile?.fee_per_session);

                    if (!tutorProfile || !hasSubjects || !hasCity || !hasLocation || !hasFee) {
                        return NextResponse.redirect(`${origin}/profile/edit?onboarding=true`);
                    }
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // If code exchange fails, redirect to continue with error
    return NextResponse.redirect(
        `${origin}/continue?error=auth_callback_failed`
    );
}
