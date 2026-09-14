import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your PDFBright account and plan access.",
};

export default function AccountPage() {
  return <AccountPanel />;
}
