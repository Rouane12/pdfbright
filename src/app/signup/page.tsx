import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your PDFBright account.",
};

export default function SignupPage() {
  return <AuthPageShell mode="signup" />;
}
