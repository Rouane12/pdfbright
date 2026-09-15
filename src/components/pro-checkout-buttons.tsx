"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { BillingPlan } from "@/lib/billing/lemon-squeezy";

type PendingPlan = BillingPlan | null;

export function ProCheckoutButtons() {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = useState<PendingPlan>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: BillingPlan) {
    setError(null);
    setPendingPlan(plan);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push(`/login?upgrade=${plan}`);
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        code?: string;
      };

      if (response.status === 409 && payload.code === "subscription_exists") {
        router.push("/account");
        return;
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout could not be started.");
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setPendingPlan(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="button button--primary justify-center"
          onClick={() => void handleCheckout("monthly")}
          disabled={pendingPlan !== null}
        >
          {pendingPlan === "monthly" ? "Opening checkout…" : "Choose monthly"}
        </button>
        <button
          type="button"
          className="button justify-center border border-sky-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50"
          onClick={() => void handleCheckout("yearly")}
          disabled={pendingPlan !== null}
        >
          {pendingPlan === "yearly" ? "Opening checkout…" : "Choose yearly"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-rose-600" role="status">{error}</p> : null}
    </div>
  );
}
