import type { Metadata } from "next";
import Link from "next/link";
import { GlobalSiteHeader } from "@/components/global-site-header";
import { PaddleCheckoutRuntime } from "@/components/paddle-checkout-runtime";
import { ProductAnalytics } from "@/components/product-analytics";
import "./globals.css";
import "./workflow-identity.css";
import "./workflow-polish.css";
import "./workflow-polish-v3.css";
import "./mobile-pass.css";
import "./auth.css";
import "./auth-providers.css";
import "./account.css";
import "./identity-v3.css";
import "./identity-v4.css";
import "./identity-v5.css";
import "./identity-v6.css";
import "./identity-v7.css";
import "./identity-v8.css";
import "./m11-launch-fixes.css";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfbright.app"),
  title: {
    default: "PDFBright — Fix messy PDFs in one click",
    template: "%s | PDFBright",
  },
  description:
    "Clean scanned PDFs, straighten pages, make text searchable with OCR, and reduce file size in one focused workflow.",
  applicationName: "PDFBright",
  alternates: {
    canonical: "/",
  },
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PDFBright",
    title: "PDFBright — Fix messy PDFs in one click",
    description:
      "Clean scanned PDFs, straighten pages, make text searchable with OCR, and reduce file size in one focused workflow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFBright — Fix messy PDFs in one click",
    description:
      "Clean scanned PDFs, straighten pages, make text searchable with OCR, and reduce file size in one focused workflow.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Skip to main content
        </a>
        {billingEnabled ? <PaddleCheckoutRuntime /> : null}
        <ProductAnalytics />
        <GlobalSiteHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <div className="border-t border-slate-200/80 bg-white">
          <nav
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-4 text-xs font-semibold text-slate-500 sm:px-6"
            aria-label="Legal navigation"
          >
            <Link className="hover:text-slate-900" href="/terms">Terms of Use</Link>
            <Link className="hover:text-slate-900" href="/privacy">Privacy Policy</Link>
            <Link className="hover:text-slate-900" href="/security">Security</Link>
            {billingEnabled ? <Link className="hover:text-slate-900" href="/refund-policy">Refund Policy</Link> : null}
          </nav>
        </div>
      </body>
    </html>
  );
}
