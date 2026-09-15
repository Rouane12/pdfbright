import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/signup",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SignupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
