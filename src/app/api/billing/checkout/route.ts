import { NextResponse } from "next/server";
import {
  captureServerAnalyticsEvent,
  captureServerException,
} from "@/lib/analytics/server";
import {
  createPaddleCheckout,
  getPaddleEnvironment,
  hasProAccess,
  type BillingPlan,
} from "@/lib/billing/paddle";
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
  if (process.env.BILLING_ENABLED !== "true") {
    return NextResponse.json(
      {
        error: "PDFBright Pro checkout is temporarily unavailable while PDFBright is free during Early Access.",
        code: "billing_disabled",
      },
      { status: 503 },
    );
  }

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

    await captureServerAnalyticsEvent("pricing_cta_clicked", user.id, {
      plan: body.plan,
      placement: "pricing",
      test_mode: getPaddleEnvironment() === "sandbox",
      billing_provider: "paddle",
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

    stage = "paddle_checkout";
    const requestOrigin = new URL(request.url).origin.replace(/\/$/, "");
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    const checkoutHost =
      getPaddleEnvironment() === "sandbox"
        ? requestOrigin
        : configuredAppUrl || requestOrigin;

    const checkout = await createPaddleCheckout({
      plan: body.plan,
      userId: user.id,
      checkoutUrl: checkoutHost,
    });

    await captureServerAnalyticsEvent("checkout_started", user.id, {
      plan: body.plan,
      test_mode: getPaddleEnvironment() === "sandbox",
      billing_provider: "paddle",
      transaction_id: checkout.transactionId,
    });

    return NextResponse.json({ url: checkout.checkoutUrl });
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
