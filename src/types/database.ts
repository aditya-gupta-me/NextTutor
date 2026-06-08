/**
 * Database types matching the Supabase schema.
 * These will eventually be auto-generated via `supabase gen types typescript`.
 * For now, manually defined to match our migration.
 */

export type UserRole = "tutor" | "student";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type SessionType = "recurring" | "one_time";
export type SessionStatus =
    | "requested"
    | "accepted"
    | "declined"
    | "active"
    | "completed"
    | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "razorpay" | "manual";
export type ParentRelationship = "father" | "mother" | "guardian";

export interface User {
    id: string;
    email: string | null;
    phone: string | null;
    full_name: string;
    role: UserRole;
    avatar_url: string | null;
    is_verified: boolean;
    created_at: string;
}

export interface TutorProfile {
    id: string;
    user_id: string;
    subjects: string[];
    qualification: string;
    bio: string;
    gender: "Male" | "Female" | "Other" | null;
    fee_per_month: number | null;
    fee_per_session: number | null;
    address: string;
    locality: string;
    city: string;
    pincode: string;
    location: unknown; // PostGIS geography type
    service_radius_km: number;
    available_seats: number;
    schedule: WeeklySchedule | null;
    govt_id_url: string | null;
    verification_status: VerificationStatus;
    slug: string;
    avg_rating: number;
    review_count: number;
    show_analytics: boolean;
    created_at: string;
}

export interface StudentProfile {
    id: string;
    user_id: string;
    school: string | null;
    gender: "Male" | "Female" | "Other" | null;
    age: number | null;
    subjects_interested: string[];
    address: string;
    locality: string;
    city: string;
    pincode: string;
    location: unknown;
    created_at: string;
}

export interface ParentInfo {
    id: string;
    student_profile_id: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string | null;
    relationship: ParentRelationship;
}

export interface TutorFaq {
    id: string;
    tutor_profile_id: string;
    question: string;
    answer: string;
    display_order: number;
}

export interface Session {
    id: string;
    tutor_profile_id: string;
    student_profile_id: string;
    type: SessionType;
    status: SessionStatus;
    schedule: unknown | null;
    session_date: string | null;
    subject: string;
    agreed_fee: number;
    fee_type: "monthly" | "per_session";
    message: string;
    created_at: string;
}

export interface Review {
    id: string;
    session_id: string;
    student_profile_id: string;
    tutor_profile_id: string;
    rating: number;
    comment: string;
    helpful_count: number;
    created_at: string;
}

export interface Payment {
    id: string;
    session_id: string;
    student_profile_id: string;
    tutor_profile_id: string;
    amount: number;
    status: PaymentStatus;
    payment_method: PaymentMethod;
    razorpay_payment_id: string | null;
    due_date: string;
    paid_at: string | null;
    created_at: string;
}

// Helpers

export interface WeeklySchedule {
    [day: string]: { start: string; end: string }[];
}

/** Tutor profile with user info joined, for display */
export interface TutorWithUser extends TutorProfile {
    user: Pick<User, "full_name" | "avatar_url" | "email" | "phone">;
    faqs?: TutorFaq[];
}

/** Session with related tutor/student info for dashboard display */
export interface SessionWithDetails extends Session {
    tutor_profile: Pick<TutorProfile, "id" | "slug"> & {
        user: Pick<User, "full_name" | "avatar_url">;
    };
    student_profile: {
        user: Pick<User, "full_name" | "avatar_url">;
    };
}
