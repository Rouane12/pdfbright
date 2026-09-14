"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AccountState = {
  email: string;
  plan: "free" | "pro";
};

export function AccountPanel() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function loadAccount() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setError("Your account is signed in, but we could not load the plan details yet.");
      }

      setAccount({
        email: user.email ?? "Signed-in user",
        plan: profile?.plan === "pro" ? "pro" : "free",
      });
      setLoading(false);
    }

    void loadAccount();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/");
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const initials = useMemo(() => {
    if (!account?.email) return "P";
    return account.email.slice(0, 1).toUpperCase();
  }, [account]);

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
    return null;
  }

  return (
    <main className="account-shell">
      <div className="account-page-orb account-page-orb--one" aria-hidden="true" />
      <div className="account-page-orb account-page-orb--two" aria-hidden="true" />

      <section className="account-inner">
        <div className="account-heading-row">
          <div>
            <p className="account-kicker"><span aria-hidden="true">✦</span> Your PDFBright account</p>
            <h1>Good to have you here.</h1>
            <p>Your account keeps access, plan status, and future usage allowances tied to one identity.</p>
          </div>
          <div className="account-avatar" aria-hidden="true">{initials}</div>
        </div>

        {error ? <div className="account-notice account-notice--warning" role="status">{error}</div> : null}

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
            {account.plan === "free" ? <Link className="account-primary-link" href="/#pricing">See Pro pricing</Link> : null}
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
