import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function GlobalSiteHeader() {
  return (
    <header className="global-site-header">
      <div className="global-site-header__inner">
        <Link href="/" className="group inline-flex items-center" aria-label="PDFBright home">
          <BrandLogo />
        </Link>

        <nav className="global-nav global-nav--desktop" aria-label="Primary navigation">
          <Link className="nav-link" href="/#how-it-works">How it works</Link>
          <Link className="nav-link" href="/#pricing">Pricing</Link>
          <Link className="global-nav__signin" href="/login">Sign in</Link>
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
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link className="global-nav-mobile__signin" href="/login">Sign in</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
