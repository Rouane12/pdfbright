import { getProcessingAllowance, type PdfBrightPlan, type ProcessingAllowance } from "@/lib/billing/entitlements";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type ProcessingEntitlement = {
  plan: PdfBrightPlan;
  authenticated: boolean;
  limits: ProcessingAllowance;
};

const FREE_ENTITLEMENT: ProcessingEntitlement = {
  plan: "free",
  authenticated: false,
  limits: getProcessingAllowance("free"),
};

export async function resolveProcessingEntitlement(): Promise<ProcessingEntitlement> {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    const response = await fetch("/api/account/entitlement", {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return FREE_ENTITLEMENT;
    }

    const payload = (await response.json().catch(() => null)) as
      | { plan?: unknown; authenticated?: unknown }
      | null;

    const plan: PdfBrightPlan = payload?.plan === "pro" ? "pro" : "free";

    return {
      plan,
      authenticated: payload?.authenticated === true,
      // Limits are resolved locally from the server-verified plan instead of
      // trusting arbitrary numeric values from the network response.
      limits: getProcessingAllowance(plan),
    };
  } catch {
    // Entitlement lookup must fail closed: if auth/network state is unclear,
    // PDFBright keeps the visitor inside the Free processing envelope.
    return FREE_ENTITLEMENT;
  }
}
