import type { Metadata } from "next";
import "./globals.css";
import "./workflow-identity.css";
import "./workflow-polish.css";

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
      <body>{children}</body>
    </html>
  );
}
