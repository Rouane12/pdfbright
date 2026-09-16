"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function MenuIcon({ kind }: { kind: "how" | "pricing" | "account" }) {
  if (kind === "how") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7.5h14M5 12h9M5 16.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m16 14 3 2.5-3 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "pricing") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5.5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 9h7M8.5 13h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16.8 13.6c1.05.2 1.7.75 1.7 1.55 0 .9-.8 1.55-2 1.55-1 0-1.7-.36-2.15-.85M16.5 12.55v5.1" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.3" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.8 18.5c.8-3.1 3-4.7 6.2-4.7s5.4 1.6 6.2 4.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GlobalSiteHeader() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const accountHref = isSignedIn ? "/account" : "/login";
  const accountLabel = isSignedIn ? "Account" : "Sign in";

  return (
    <header className="global-site-header">
      <div className="global-site-header__inner">
        <Link href="/" className="group inline-flex items-center" aria-label="PDFBright home">
          <BrandLogo />
        </Link>

        <nav className="global-nav global-nav--desktop" aria-label="Primary navigation">
          <Link className="nav-link" href="/#how-it-works">How it works</Link>
          <Link className="nav-link" href="/#pricing">Pricing</Link>
          <Link className="nav-link" href="/terms">Terms</Link>
          <Link className="nav-link" href="/refund-policy">Refunds</Link>
          <Link className="global-nav__signin" href={accountHref}>{accountLabel}</Link>
        </nav>

        <details className="global-nav-mobile">
          <summary aria-label="Open navigation menu">
            <span className="menu-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>
          <nav className="global-nav-mobile__panel" aria-label="Mobile navigation">
            <Link className="global-nav-mobile__item" href="/#how-it-works">
              <span className="global-nav-mobile__icon global-nav-mobile__icon--how"><MenuIcon kind="how" /></span>
              <span>How it works</span>
            </Link>
            <Link className="global-nav-mobile__item" href="/#pricing">
              <span className="global-nav-mobile__icon global-nav-mobile__icon--pricing"><MenuIcon kind="pricing" /></span>
              <span>Pricing</span>
            </Link>
            <Link className="global-nav-mobile__item" href="/terms">
              <span>Terms of Use</span>
            </Link>
            <Link className="global-nav-mobile__item" href="/refund-policy">
              <span>Refund Policy</span>
            </Link>
            <Link className="global-nav-mobile__item global-nav-mobile__signin" href={accountHref}>
              <span className="global-nav-mobile__icon global-nav-mobile__icon--account"><MenuIcon kind="account" /></span>
              <span>{accountLabel}</span>
              <span className="global-nav-mobile__spark" aria-hidden="true">✦</span>
            </Link>
            <span className="global-nav-mobile__note" aria-hidden="true">clean PDFs, less fuss ↗</span>
          </nav>
        </details>
      </div>
    </header>
  );
}
