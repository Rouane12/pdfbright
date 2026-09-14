"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";
type Status = { kind: "success" | "error"; message: string } | null;
type PendingAction = "google" | "facebook" | "sso" | "email" | null;

function getAccountRedirect() {
  return `${window.location.origin}/account`;
}

function normalizeSsoDomain(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";

  if (trimmed.includes("@")) {
    return trimmed.split("@").pop() ?? "";
  }

  return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

function GoogleIcon() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}

function FacebookIcon() {
  return <span className="facebook-mark" aria-hidden="true">f</span>;
}

function SsoIcon() {
  return (
    <span className="sso-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M5 9.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v8.4a2.8 2.8 0 0 1-2.8 2.8H9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3.8 12h8.4M8.8 8.8 12 12l-3.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ssoIdentity, setSsoIdentity] = useState("");
  const [showSso, setShowSso] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const isLogin = mode === "login";
  const isSubmitting = pendingAction !== null;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/account");
      }
    });
  }, [router]);

  async function handleOAuth(provider: "google" | "facebook") {
    setStatus(null);
    setPendingAction(provider);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAccountRedirect(),
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      throw new Error(`${provider === "google" ? "Google" : "Facebook"} sign-in did not return a secure redirect.`);
    } catch (error) {
      const providerLabel = provider === "google" ? "Google" : "Facebook";
      const message = error instanceof Error ? error.message : `${providerLabel} sign-in could not start.`;
      setStatus({ kind: "error", message });
      setPendingAction(null);
    }
  }

  async function handleSsoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const domain = normalizeSsoDomain(ssoIdentity);
    if (!domain || !domain.includes(".")) {
      setStatus({ kind: "error", message: "Enter your work email or company domain to continue with SSO." });
      return;
    }

    setPendingAction("sso");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithSSO({
        domain,
        options: {
          redirectTo: getAccountRedirect(),
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No SSO provider is configured for that company domain yet.");

      window.location.assign(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSO sign-in could not start.";
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
          emailRedirectTo: getAccountRedirect(),
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

      <div className="auth-provider-grid" aria-label="Sign in options">
        <button
          className="auth-provider-button auth-provider-button--google"
          type="button"
          onClick={() => void handleOAuth("google")}
          disabled={isSubmitting}
        >
          <GoogleIcon />
          <span>{pendingAction === "google" ? "Opening…" : "Google"}</span>
        </button>

        <button
          className="auth-provider-button auth-provider-button--facebook"
          type="button"
          onClick={() => void handleOAuth("facebook")}
          disabled={isSubmitting}
        >
          <FacebookIcon />
          <span>{pendingAction === "facebook" ? "Opening…" : "Facebook"}</span>
        </button>

        <button
          className="auth-provider-button auth-provider-button--sso"
          type="button"
          onClick={() => {
            setStatus(null);
            setShowSso((value) => !value);
          }}
          disabled={isSubmitting}
          aria-expanded={showSso}
          aria-controls="pdfbright-sso-panel"
        >
          <SsoIcon />
          <span>SSO</span>
        </button>
      </div>

      {showSso ? (
        <form id="pdfbright-sso-panel" className="auth-sso-panel" onSubmit={handleSsoSubmit}>
          <div className="auth-sso-copy">
            <strong>Company SSO</strong>
            <span>Use your work email or company domain.</span>
          </div>
          <div className="auth-sso-row">
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={ssoIdentity}
              onChange={(event) => setSsoIdentity(event.target.value)}
              disabled={isSubmitting}
              aria-label="Work email or company domain"
              required
            />
            <button type="submit" disabled={isSubmitting}>
              {pendingAction === "sso" ? "Opening…" : "Continue"}
            </button>
          </div>
        </form>
      ) : null}

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
        <Link href={isLogin ? "/signup" : "/login"}>{isLogin ? "Create an account" : "Log in"}</Link>
      </p>

      <p className="auth-legal">
        By continuing, you agree to PDFBright&apos;s terms and acknowledge the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
