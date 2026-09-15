import type { Metadata } from "next";
import { GlobalSiteHeader } from "@/components/global-site-header";
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

const siteTitle = "PDFBright — Clean, Straighten & Make PDFs Searchable";
const siteDescription =
  "Clean messy PDFs in one focused workflow: straighten scans, make text searchable, remove blank pages, normalize pages, and reduce file size.";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfbright.app"),
  applicationName: "PDFBright",
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "PDFBright",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
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
        <GlobalSiteHeader />
        {children}
      </body>
    </html>
  );
}
