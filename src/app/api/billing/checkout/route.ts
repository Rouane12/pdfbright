import { NextResponse } from "next/server";
import {
  captureServerAnalyticsEvent,
  captureServerException,
} from "@/lib/analytics/server";
import {
  createLemonCheckout,
  hasProAccess,
  type BillingPlan,
} from "@/lib/billing/lemon-squeezy";
import {
  getSupabaseAdminClient,
  getSupabaseAuthServerClient,
  readBearerToken,
} from "@/lib/server/supabase";

export const runtime = "nodejs";

function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "monthly" || value === "yearly";
}

function describeCheckoutError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;
    const parts = ["message", "details", "hint", "code"]
      .map((key) => candidate[key])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    if (parts.length > 0) {
      return parts.join(" · ");
    }
  }

  return "Checkout could not be started. Please try again.";
}

export async function POST(request: Request) {
  let stage = "request";
  let analyticsUserId: string | null = null;

  try {
    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Sign in before upgrading." }, { status: 401 });
    }

    stage = "auth";
    const supabase = getSupabaseAuthServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.id || !user.email) {
      return NextResponse.json({ error: "Your sign-in session could not be verified." }, { status: 401 });
    }

    analyticsUserId = user.id;
    const body = (await request.json().catch(() => null)) as { plan?: unknown } | null;

    if (!isBillingPlan(body?.plan)) {
      return NextResponse.json({ error: "Choose a valid PDFBright Pro plan." }, { status: 400 });
    }

    // Treat an authenticated, valid checkout request as the trusted pricing CTA.
    // This avoids losing the commercial-funnel event during client navigation.
    await captureServerAnalyticsEvent("pricing_cta_clicked", user.id, {
      plan: body.plan,
      placement: "pricing",
      test_mode: process.env.LEMON_SQUEEZY_TEST_MODE === "true",
    });

    stage = "subscription_lookup";
    const admin = getSupabaseAdminClient();
    const { data: existingSubscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("status, provider_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (existingSubscription && hasProAccess(existingSubscription.status)) {
      return NextResponse.json(
        {
          error: "This account already has a PDFBright Pro subscription.",
          code: "subscription_exists",
        },
        { status: 409 },
      );
    }

    stage = "lemon_checkout";
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const checkoutUrl = await createLemonCheckout({
      plan: body.plan,
      userId: user.id,
      email: user.email,
      redirectUrl: `${appUrl}/account?checkout=success`,
    });

    await captureServerAnalyticsEvent("checkout_started", user.id, {
      plan: body.plan,
      test_mode: process.env.LEMON_SQUEEZY_TEST_MODE === "true",
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("PDFBright checkout creation failed", { stage, error });
    await captureServerException("billing_checkout", error, analyticsUserId, { step: stage });

    const showPreviewError = process.env.VERCEL_ENV !== "production";
    const message = showPreviewError
      ? describeCheckoutError(error)
      : "Checkout could not be started. Please try again.";

    return NextResponse.json(
      {
        error: message,
        ...(showPreviewError ? { code: "checkout_create_failed", stage } : {}),
      },
      { status: 500 },
    );
  }
}
