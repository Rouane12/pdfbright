"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type UpgradePlan = "monthly" | "yearly";
type BillingAction = UpgradePlan | "portal" | null;

type AccountState = {
  email: string;
  plan: "free" | "pro";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
};

type AccountReadResult = {
  account: AccountState;
  warning: string | null;
};

function readUpgradePlan(value: string | null): UpgradePlan | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

export function AccountPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingAction, setBillingAction] = useState<BillingAction>(null);
  const attemptedUpgrade = useRef<UpgradePlan | null>(null);
  const upgradePlan = readUpgradePlan(searchParams.get("upgrade"));
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const readAccountState = useCallback(async (): Promise<AccountReadResult | null> => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      return null;
    }

    const [profileResult, subscriptionResult] = await Promise.all([
      supabase.from("profiles").select("plan").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const warning =
      profileResult.error || subscriptionResult.error
        ? "You are signed in, but some plan details could not be loaded yet. You can still use your account while we retry."
        : null;

    if (profileResult.error) {
      console.error("PDFBright profile lookup failed", profileResult.error);
    }

    if (subscriptionResult.error) {
      console.error("PDFBright subscription lookup failed", subscriptionResult.error);
    }

    return {
      account: {
        email: user.email ?? "Signed-in user",
        plan: profileResult.data?.plan === "pro" ? "pro" : "free",
        subscriptionStatus: subscriptionResult.data?.status ?? null,
        currentPeriodEnd: subscriptionResult.data?.current_period_end ?? null,
      },
      warning,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      setLoading(true);
      setError(null);

      try {
        const result = await readAccountState();

        if (cancelled) return;

        if (!result) {
          router.replace("/login");
          return;
        }

        setAccount(result.account);
        setError(result.warning);
      } catch (loadError) {
        console.error("PDFBright account load failed", loadError);
        if (!cancelled) {
          setError("Your account could not be loaded. Refresh the page or sign in again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAccount();

    const supabase = getSupabaseBrowserClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/");
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [readAccountState, router]);

  useEffect(() => {
    if (!checkoutSuccess || !account || account.plan === "pro") return;

    let cancelled = false;
    let attempts = 0;

    const timer = window.setInterval(() => {
      void (async () => {
        attempts += 1;

        try {
          const result = await readAccountState();
          if (cancelled || !result) return;

          setAccount(result.account);
          setError(result.warning);

          if (result.account.plan === "pro") {
            setBillingMessage("PDFBright Pro is active on this account.");
            window.clearInterval(timer);
            router.replace("/account");
          } else if (attempts >= 12) {
            setBillingMessage("Your payment is complete, but Pro access is still syncing. Refresh this page in a moment if it does not update automatically.");
            window.clearInterval(timer);
          }
        } catch {
          if (attempts >= 12) {
            setBillingMessage("Your payment is complete, but we could not confirm the entitlement yet. Please refresh shortly.");
            window.clearInterval(timer);
          }
        }
      })();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [account, checkoutSuccess, readAccountState, router]);

  const initials = useMemo(() => {
    if (!account?.email) return "P";
    return account.email.slice(0, 1).toUpperCase();
  }, [account]);

  const startCheckout = useCallback(async (plan: UpgradePlan) => {
    setBillingMessage(null);
    setBillingAction(plan);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(`/login?upgrade=${plan}`);
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
        const result = await readAccountState();
        if (result) {
          setAccount(result.account);
          setError(result.warning);
        }
        router.replace("/account");
        return;
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout could not be started.");
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setBillingMessage(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setBillingAction(null);
      router.replace("/account");
    }
  }, [readAccountState, router]);

  useEffect(() => {
    if (!account || !upgradePlan || account.plan === "pro" || attemptedUpgrade.current === upgradePlan) {
      return;
    }

    attemptedUpgrade.current = upgradePlan;
    void startCheckout(upgradePlan);
  }, [account, startCheckout, upgradePlan]);

  const openBillingPortal = useCallback(async () => {
    setBillingMessage(null);
    setBillingAction("portal");

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Billing management could not be opened.");
      }

      window.location.assign(payload.url);
    } catch (portalError) {
      setBillingMessage(portalError instanceof Error ? portalError.message : "Billing management could not be opened.");
      setBillingAction(null);
    }
  }, [router]);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="account-shell account-shell--loading" aria-busy="true">
        <div className="account-loading-mark" aria-hidden="true">✦</div>
        <p>Opening your PDFBright account…</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="account-shell account-shell--loading">
        <div className="account-loading-mark" aria-hidden="true">✦</div>
        <p>{error ?? "We could not open your PDFBright account."}</p>
      </main>
    );
  }

  const visibleBillingMessage =
    billingMessage ??
    (checkoutSuccess && account.plan === "free"
      ? "Payment received. Finalizing your PDFBright Pro access…"
      : null);

  return (
    <main className="account-shell">
      <div className="account-page-orb account-page-orb--one" aria-hidden="true" />
      <div className="account-page-orb account-page-orb--two" aria-hidden="true" />

      <section className="account-inner">
        <div className="account-heading-row">
          <div>
            <p className="account-kicker"><span aria-hidden="true">✦</span> Your PDFBright account</p>
            <h1>Good to have you here.</h1>
            <p>Your account keeps access, plan status, and usage allowances tied to one identity.</p>
          </div>
          <div className="account-avatar" aria-hidden="true">{initials}</div>
        </div>

        {error ? <div className="account-notice account-notice--warning" role="status">{error}</div> : null}
        {visibleBillingMessage ? <div className="account-notice" role="status">{visibleBillingMessage}</div> : null}

        <div className="account-grid">
          <article className="account-card account-card--identity">
            <div className="account-card-label">Identity</div>
            <h2>Signed in securely</h2>
            <p className="account-email">{account.email}</p>
            <p className="account-card-copy">PDFBright stores only the account data needed for access, billing, and usage—not your document contents.</p>
          </article>

          <article className={`account-card account-card--plan ${account.plan === "pro" ? "is-pro" : ""}`}>
            <div className="account-plan-badge"><span aria-hidden="true">✦</span> {account.plan === "pro" ? "PDFBright Pro" : "Free plan"}</div>
            <h2>{account.plan === "pro" ? "More room when you need it." : "Core cleanup stays free."}</h2>
            <p className="account-card-copy">
              {account.plan === "pro"
                ? "Your Pro entitlement is active on this account."
                : "Upgrade when you need larger files, heavier OCR, and more room for repeat workflows."}
            </p>
            {account.plan === "pro" && account.subscriptionStatus ? (
              <p className="account-card-copy">Subscription status: <strong>{account.subscriptionStatus.replaceAll("_", " ")}</strong>.</p>
            ) : null}
            {account.plan === "free" ? (
              <div className="account-actions">
                <button className="account-primary-link" type="button" onClick={() => void startCheckout("monthly")} disabled={billingAction !== null}>
                  {billingAction === "monthly" ? "Opening checkout…" : "Go Pro monthly — $7.99"}
                </button>
                <button className="account-signout" type="button" onClick={() => void startCheckout("yearly")} disabled={billingAction !== null}>
                  {billingAction === "yearly" ? "Opening checkout…" : "Yearly — $59.99"}
                </button>
              </div>
            ) : (
              <button className="account-primary-link" type="button" onClick={() => void openBillingPortal()} disabled={billingAction !== null}>
                {billingAction === "portal" ? "Opening billing…" : "Manage billing"}
              </button>
            )}
          </article>

          <article className="account-card account-card--privacy">
            <div className="account-card-icon" aria-hidden="true">✓</div>
            <h2>Local-first stays local-first</h2>
            <p className="account-card-copy">Signing in does not turn PDFBright into a document library. Supported cleanup continues in your browser.</p>
            <Link className="account-text-link" href="/privacy">Privacy details</Link>
          </article>

          <article className="account-card account-card--actions">
            <div className="account-card-label">Account controls</div>
            <h2>Keep it simple.</h2>
            <p className="account-card-copy">Process another file, review pricing, or sign out when you are finished.</p>
            <div className="account-actions">
              <Link className="account-primary-link" href="/#upload">Clean a PDF</Link>
              <button className="account-signout" type="button" onClick={signOut}>Sign out</button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
