import { createClient } from "@/lib/supabase/server";
import { BoxIcon } from "@/components/ui/BoxIcon";

export default async function PaymentsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user!.id)
        .single();

    const role = profile?.role || "student";

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
            <div className="mb-8">
                <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                    Payments
                </h1>
                <p className="mt-1 text-text-secondary">
                    {role === "tutor"
                        ? "Track your earnings and payment history."
                        : "View your payment history and upcoming dues."}
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="rounded-[var(--radius-lg)] border border-border bg-bg-white p-5">
                    <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                        {role === "tutor" ? "Total Earned" : "Total Paid"}
                    </div>
                    <div className="text-2xl font-bold text-text-primary">₹0</div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-bg-white p-5">
                    <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                        Pending
                    </div>
                    <div className="text-2xl font-bold text-warning">₹0</div>
                </div>
                {role === "student" && (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-white p-5">
                        <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                            Next Due
                        </div>
                        <div className="text-2xl font-bold text-text-primary">—</div>
                    </div>
                )}
            </div>

            {/* Payment history */}
            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-10 text-center">
                <BoxIcon className="bx bx-credit-card-alt text-4xl text-text-tertiary mb-3" />
                <p className="text-lg font-medium text-text-primary">
                    No payments yet
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                    Payment history will appear here once sessions are booked.
                </p>
            </div>
        </div>
    );
}
