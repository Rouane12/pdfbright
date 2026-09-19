import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your PDFBright account and plan access.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="account-shell account-shell--loading" aria-busy="true"><p>Opening your PDFBright account…</p></main>}>
      <AccountPanel />
    </Suspense>
  );
}
