import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your PDFBright account.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageShell mode="signup" />
    </Suspense>
  );
}
