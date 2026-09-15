import type { Metadata } from "next";
import { GlobalSiteHeader } from "@/components/global-site-header";
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
        <ProductAnalytics />
        <GlobalSiteHeader />
        {children}
      </body>
    </html>
  );
}
