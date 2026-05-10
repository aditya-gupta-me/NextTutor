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
                    .select("full_name")
                    .eq("id", user.id)
                    .maybeSingle();

                // No profile or empty name → send to onboarding
                if (!profile?.full_name || profile.full_name.trim() === "") {
                    return NextResponse.redirect(`${origin}/onboarding`);
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
