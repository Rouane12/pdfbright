import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your PDFBright account.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageShell mode="login" />
    </Suspense>
  );
}
