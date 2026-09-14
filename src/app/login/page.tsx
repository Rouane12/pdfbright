import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your PDFBright account.",
};

export default function LoginPage() {
  return <AuthPageShell mode="login" />;
}
