import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Security | PDFBright",
    template: "%s | PDFBright",
  },
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
