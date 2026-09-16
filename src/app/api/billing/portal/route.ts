import { NextResponse } from "next/server";
import { captureServerException } from "@/lib/analytics/server";
import { retrieveLemonSubscription } from "@/lib/billing/lemon-squeezy";
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
      .select("provider, provider_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (subscription?.provider !== "lemon_squeezy" || !subscription.provider_subscription_id) {
      return NextResponse.json({ error: "No PDFBright Pro subscription was found." }, { status: 404 });
    }

    stage = "lemon_subscription";
    const remoteSubscription = await retrieveLemonSubscription(subscription.provider_subscription_id);
    const portalUrl = remoteSubscription.attributes.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json({ error: "Billing management is temporarily unavailable." }, { status: 503 });
    }

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
