"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";
type Status = { kind: "success" | "error"; message: string } | null;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/account");
      }
    });
  }, [router]);

  async function handleGoogleSignIn() {
    setStatus(null);
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/account`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in could not start.";
      setStatus({ kind: "error", message });
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/account`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: !isLogin,
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

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
      setIsSubmitting(false);
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

      <button
        className="auth-social-button"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
      >
        <span className="google-mark" aria-hidden="true">G</span>
        {isSubmitting ? "Opening secure sign-in…" : "Continue with Google"}
      </button>

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
          {isSubmitting
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
