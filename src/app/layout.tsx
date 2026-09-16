import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PDFBright",
    template: "%s | PDFBright",
  },
  description: "Fix messy PDFs in one click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="border-t border-slate-200/80 bg-white">
          <nav
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-4 text-xs font-semibold text-slate-500 sm:px-6"
            aria-label="Legal navigation"
          >
            <Link className="hover:text-slate-900" href="/terms">Terms of Use</Link>
            <Link className="hover:text-slate-900" href="/privacy">Privacy Policy</Link>
            <Link className="hover:text-slate-900" href="/refund-policy">Refund Policy</Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
