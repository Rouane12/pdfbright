import type { Metadata } from "next";
import { GlobalSiteHeader } from "@/components/global-site-header";
import "./globals.css";
import "./workflow-identity.css";
import "./workflow-polish.css";
import "./workflow-polish-v3.css";
import "./mobile-pass.css";
import "./auth.css";

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
        <GlobalSiteHeader />
        {children}
      </body>
    </html>
  );
}
