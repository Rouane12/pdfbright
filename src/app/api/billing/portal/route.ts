import { NextResponse } from "next/server";
import { captureServerException } from "@/lib/analytics/server";
import { createPaddlePortalSession } from "@/lib/billing/paddle";
import {
  getSupabaseAdminClient,
  getSupabaseAuthServerClient,
  readBearerToken,
} from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let analyticsUserId: string | null = null;
  let stage = "request";

  try {
    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
    }

    stage = "auth";
    const supabase = getSupabaseAuthServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.id) {
      return NextResponse.json({ error: "Your sign-in session could not be verified." }, { status: 401 });
    }

    analyticsUserId = user.id;
    stage = "subscription_lookup";
    const admin = getSupabaseAdminClient();
    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("provider, provider_customer_id, provider_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (
      subscription?.provider !== "paddle" ||
      !subscription.provider_customer_id ||
      !subscription.provider_subscription_id
    ) {
      return NextResponse.json({ error: "No PDFBright Pro subscription was found." }, { status: 404 });
    }

    stage = "paddle_portal";
    const portalUrl = await createPaddlePortalSession({
      customerId: subscription.provider_customer_id,
      subscriptionId: subscription.provider_subscription_id,
    });

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("PDFBright billing portal failed", error);
    await captureServerException("billing_portal", error, analyticsUserId, { step: stage });

    return NextResponse.json(
      { error: "Billing management could not be opened. Please try again." },
      { status: 500 },
    );
  }
}
