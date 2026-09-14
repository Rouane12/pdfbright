import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";

type AuthMode = "login" | "signup";

export function AuthPageShell({ mode }: { mode: AuthMode }) {
  return (
    <main className="auth-shell">
      <section className="auth-main-panel">
        <div className="auth-main-inner">
          <Link href="/" className="auth-home-link" aria-label="Back to PDFBright">
            <BrandLogo />
          </Link>
          <AuthForm mode={mode} />
          <Link className="auth-back-link" href="/">← Back to PDFBright</Link>
        </div>
      </section>

      <aside className="auth-visual-panel" aria-label="About PDFBright accounts">
        <div className="auth-visual-orb auth-visual-orb--one" aria-hidden="true" />
        <div className="auth-visual-orb auth-visual-orb--two" aria-hidden="true" />
        <div className="auth-visual-inner">
          <div className="auth-visual-badge"><span aria-hidden="true">✦</span> A brighter account experience</div>
          <div className="auth-mini-demo" aria-hidden="true">
            <div className="auth-mini-page auth-mini-page--before">
              <span className="auth-mini-fold" />
              <span className="auth-mini-line auth-mini-line--long" />
              <span className="auth-mini-line" />
              <span className="auth-mini-scan" />
              <span className="auth-mini-chip">messy</span>
            </div>
            <div className="auth-mini-arrow">→<span>✦</span></div>
            <div className="auth-mini-page auth-mini-page--after">
              <span className="auth-mini-fold" />
              <span className="auth-mini-line auth-mini-line--long" />
              <span className="auth-mini-line" />
              <span className="auth-mini-scan" />
              <span className="auth-mini-chip">clean</span>
            </div>
          </div>
          <h2>One account. More room when you need it.</h2>
          <p>
            PDFBright stays useful without an account. Sign in when you want Pro entitlement, higher usage limits, and account-level billing.
          </p>
          <div className="auth-benefits">
            <div><span>✓</span><p><strong>Pro follows your account</strong><br />Keep subscription access tied to one identity.</p></div>
            <div><span>✓</span><p><strong>Minimal profile data</strong><br />Accounts are for access and usage—not a document library.</p></div>
            <div><span>✓</span><p><strong>Local-first stays local-first</strong><br />Signing in does not change the current browser-first cleanup model.</p></div>
          </div>
        </div>
      </aside>
    </main>
  );
}
