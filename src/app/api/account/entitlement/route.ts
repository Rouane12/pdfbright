import { NextResponse } from "next/server";
import { getProcessingAllowance, type PdfBrightPlan } from "@/lib/billing/entitlements";
import { hasProAccess } from "@/lib/billing/lemon-squeezy";
import {
  getSupabaseAdminClient,
  getSupabaseAuthServerClient,
  readBearerToken,
} from "@/lib/server/supabase";

export const runtime = "nodejs";

function entitlementResponse(plan: PdfBrightPlan, authenticated: boolean) {
  return NextResponse.json(
    {
      plan,
      authenticated,
      limits: getProcessingAllowance(plan),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: Request) {
  try {
    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return entitlementResponse("free", false);
    }

    const supabase = getSupabaseAuthServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "Your sign-in session could not be verified." },
        { status: 401 },
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    const plan: PdfBrightPlan = hasProAccess(subscription?.status) ? "pro" : "free";
    return entitlementResponse(plan, true);
  } catch (error) {
    console.error("PDFBright entitlement lookup failed", error);
    return NextResponse.json(
      { error: "Processing limits could not be loaded." },
      { status: 500 },
    );
  }
}
