"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [status, setStatus] = useState<string | null>(null);
  const isLogin = mode === "login";

  function showPreviewNotice() {
    setStatus("Authentication is not connected in this preview yet. No account was changed and no email was sent.");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showPreviewNotice();
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

      <button className="auth-social-button" type="button" onClick={showPreviewNotice}>
        <span className="google-mark" aria-hidden="true">G</span>
        Continue with Google
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
          required
        />
        <button className="auth-primary-button" type="submit">
          {isLogin ? "Email me a sign-in link" : "Create account with email"}
        </button>
      </form>

      <p className="auth-magic-note">No password to remember. We plan to use secure email sign-in links and OAuth.</p>

      {status ? <p className="auth-preview-notice" role="status">{status}</p> : null}

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
