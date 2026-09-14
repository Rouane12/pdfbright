import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Sign in before upgrading." }, { status: 401 });
    }

    const supabase = getSupabaseAuthServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.id || !user.email) {
      return NextResponse.json({ error: "Your sign-in session could not be verified." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { plan?: unknown } | null;

    if (!isBillingPlan(body?.plan)) {
      return NextResponse.json({ error: "Choose a valid PDFBright Pro plan." }, { status: 400 });
    }

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

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const checkoutUrl = await createLemonCheckout({
      plan: body.plan,
      userId: user.id,
      email: user.email,
      redirectUrl: `${appUrl}/account?checkout=success`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("PDFBright checkout creation failed", error);

    const showPreviewError = process.env.VERCEL_ENV !== "production";
    const message =
      showPreviewError && error instanceof Error
        ? error.message
        : "Checkout could not be started. Please try again.";

    return NextResponse.json(
      {
        error: message,
        ...(showPreviewError ? { code: "checkout_create_failed" } : {}),
      },
      { status: 500 },
    );
  }
}
