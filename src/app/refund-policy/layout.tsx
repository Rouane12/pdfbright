import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
