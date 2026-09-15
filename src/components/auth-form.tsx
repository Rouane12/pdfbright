"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";
type UpgradePlan = "monthly" | "yearly";
type Status = { kind: "success" | "error"; message: string } | null;
type PendingAction = "google" | "email" | null;

function readUpgradePlan(value: string | null): UpgradePlan | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

function getAccountRedirect(upgradePlan: UpgradePlan | null) {
  const url = new URL("/account", window.location.origin);

  if (upgradePlan) {
    url.searchParams.set("upgrade", upgradePlan);
  }

  return url.toString();
}

function GoogleIcon() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.741 2.982-4.305 2.982-7.351Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.041.955-3.386.955-2.605 0-4.809-1.759-5.6-4.123H3.059v2.591A9.998 9.998 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9A6.013 6.013 0 0 1 6.086 12c0-.659.114-1.3.314-1.9V7.509H3.059A9.994 9.994 0 0 0 2 12c0 1.614.386 3.141 1.059 4.491L6.4 13.9Z" />
      <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.991 14.695 2 12 2a9.998 9.998 0 0 0-8.941 5.509L6.4 10.1C7.191 7.736 9.395 5.977 12 5.977Z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const isLogin = mode === "login";
  const isSubmitting = pendingAction !== null;
  const upgradePlan = useMemo(() => readUpgradePlan(searchParams.get("upgrade")), [searchParams]);
  const accountPath = upgradePlan ? `/account?upgrade=${upgradePlan}` : "/account";
  const alternateAuthPath = `${isLogin ? "/signup" : "/login"}${upgradePlan ? `?upgrade=${upgradePlan}` : ""}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(accountPath);
      }
    });
  }, [accountPath, router]);

  async function handleGoogleOAuth() {
    setStatus(null);
    setPendingAction("google");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAccountRedirect(upgradePlan),
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      throw new Error("Google sign-in did not return a secure redirect.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in could not start.";
      setStatus({ kind: "error", message });
      setPendingAction(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setPendingAction("email");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: !isLogin,
          emailRedirectTo: getAccountRedirect(upgradePlan),
        },
      });

      if (error) throw error;

      setStatus({
        kind: "success",
        message: isLogin
          ? "Check your inbox. We sent a secure PDFBright sign-in link."
          : "Check your inbox to finish creating your PDFBright account.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not send the sign-in link.";
      setStatus({ kind: "error", message });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-kicker"><span aria-hidden="true">✦</span> PDFBright account</div>
      <h1>{isLogin ? "Welcome back." : "Create your account."}</h1>
      <p className="auth-intro">
        {isLogin
          ? "Sign in to keep your Pro access and usage connected across sessions."
          : "Create an account when you want Pro access, higher limits, and a consistent experience across sessions."}
      </p>

      {upgradePlan ? (
        <p className="auth-preview-notice" data-kind="success" role="status">
          Sign in first, then we&apos;ll continue straight to your {upgradePlan === "monthly" ? "monthly" : "yearly"} PDFBright Pro checkout.
        </p>
      ) : null}

      <div className="auth-provider-grid" aria-label="Sign in options">
        <button
          className="auth-provider-button auth-provider-button--google"
          type="button"
          onClick={() => void handleGoogleOAuth()}
          disabled={isSubmitting}
        >
          <GoogleIcon />
          <span>{pendingAction === "google" ? "Opening Google…" : "Continue with Google"}</span>
        </button>
      </div>

      <div className="auth-divider"><span>or continue with email</span></div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor={`${mode}-email`}>Email address</label>
        <input
          id={`${mode}-email`}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          required
        />
        <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
          {pendingAction === "email"
            ? "Sending secure link…"
            : isLogin
              ? "Email me a sign-in link"
              : "Create account with email"}
        </button>
      </form>

      <p className="auth-magic-note">Secure email sign-in links. No password to remember.</p>

      {status ? (
        <p className="auth-preview-notice" data-kind={status.kind} role="status">
          {status.message}
        </p>
      ) : null}

      <p className="auth-switch">
        {isLogin ? "New to PDFBright?" : "Already have an account?"}{" "}
        <Link href={alternateAuthPath}>{isLogin ? "Create an account" : "Log in"}</Link>
      </p>

      <p className="auth-legal">
        By continuing, you agree to PDFBright&apos;s <Link href="/terms">Terms of Use</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
