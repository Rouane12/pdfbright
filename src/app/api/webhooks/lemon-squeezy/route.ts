import { NextResponse } from "next/server";
import { captureServerAnalyticsEvent } from "@/lib/analytics/server";
import {
  getLemonStoreId,
  hasProAccess,
  isKnownVariant,
  type LemonSubscriptionAttributes,
  verifyLemonWebhookSignature,
} from "@/lib/billing/lemon-squeezy";
import { getSupabaseAdminClient } from "@/lib/server/supabase";

export const runtime = "nodejs";

const subscriptionEvents = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);

const paymentEvents = new Set(["subscription_payment_success"]);

type LemonSubscriptionInvoiceAttributes = {
  store_id?: number;
  subscription_id?: number;
  customer_id?: number;
  billing_reason?: string;
  status?: string;
  currency?: string;
  total?: number;
  total_usd?: number;
  test_mode?: boolean;
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
    };
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: LemonSubscriptionAttributes | LemonSubscriptionInvoiceAttributes;
  };
};

async function resolveInvoiceUserId(
  payload: LemonWebhookPayload,
  subscriptionId: number,
) {
  const customUserId = payload.meta?.custom_data?.user_id?.trim();
  if (customUserId) return customUserId;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("provider", "lemon_squeezy")
    .eq("provider_subscription_id", String(subscriptionId))
    .maybeSingle();

  if (error) throw error;
  return data?.user_id?.trim() || null;
}

async function handleSubscriptionPaymentSuccess(payload: LemonWebhookPayload) {
  if (payload.data?.type !== "subscription-invoices" || !payload.data.id || !payload.data.attributes) {
    return NextResponse.json({ error: "Subscription payment webhook data is incomplete." }, { status: 400 });
  }

  const attributes = payload.data.attributes as LemonSubscriptionInvoiceAttributes;
  if (
    attributes.store_id !== getLemonStoreId() ||
    typeof attributes.subscription_id !== "number"
  ) {
    console.warn("Ignoring Lemon Squeezy payment webhook for an unknown store or subscription", {
      invoiceId: payload.data.id,
      storeId: attributes.store_id,
      subscriptionId: attributes.subscription_id,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const userId = await resolveInvoiceUserId(payload, attributes.subscription_id);
    if (!userId) {
      console.warn("Ignoring Lemon Squeezy payment webhook without a PDFBright user mapping", {
        invoiceId: payload.data.id,
        subscriptionId: attributes.subscription_id,
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    const analyticsProperties = {
      billing_reason: attributes.billing_reason ?? null,
      amount_usd_cents: attributes.total_usd ?? null,
      currency: attributes.currency ?? null,
      test_mode: attributes.test_mode ?? null,
    };

    if (attributes.billing_reason === "initial") {
      await captureServerAnalyticsEvent("purchase_completed", userId, analyticsProperties);
    } else if (attributes.billing_reason === "renewal") {
      await captureServerAnalyticsEvent("subscription_renewed", userId, analyticsProperties);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PDFBright Lemon Squeezy payment analytics failed", {
      invoiceId: payload.data.id,
      subscriptionId: attributes.subscription_id,
      error,
    });

    return NextResponse.json({ error: "Payment webhook processing failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: LemonWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;

  if (!eventName) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (paymentEvents.has(eventName)) {
    return handleSubscriptionPaymentSuccess(payload);
  }

  if (!subscriptionEvents.has(eventName)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (payload.data?.type !== "subscriptions" || !payload.data.id || !payload.data.attributes) {
    return NextResponse.json({ error: "Subscription webhook data is incomplete." }, { status: 400 });
  }

  const userId = payload.meta?.custom_data?.user_id?.trim();
  const attributes = payload.data.attributes as LemonSubscriptionAttributes;

  if (!userId) {
    console.warn("Ignoring Lemon Squeezy subscription webhook without PDFBright user_id", {
      eventName,
      subscriptionId: payload.data.id,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  if (attributes.store_id !== getLemonStoreId() || !isKnownVariant(attributes.variant_id)) {
    console.warn("Ignoring Lemon Squeezy webhook for an unknown store or variant", {
      eventName,
      subscriptionId: payload.data.id,
      storeId: attributes.store_id,
      variantId: attributes.variant_id,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const admin = getSupabaseAdminClient();
    const periodEnd = attributes.ends_at ?? attributes.renews_at ?? null;

    const { error: subscriptionError } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "lemon_squeezy",
        provider_customer_id: String(attributes.customer_id),
        provider_subscription_id: payload.data.id,
        status: attributes.status,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (subscriptionError) {
      throw subscriptionError;
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        plan: hasProAccess(attributes.status) ? "pro" : "free",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileError) {
      throw profileError;
    }

    if (eventName === "subscription_cancelled") {
      await captureServerAnalyticsEvent("subscription_cancelled", userId, {
        plan: payload.meta?.custom_data?.plan ?? null,
        test_mode: attributes.test_mode,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PDFBright Lemon Squeezy webhook sync failed", {
      eventName,
      subscriptionId: payload.data.id,
      error,
    });

    return NextResponse.json({ error: "Webhook sync failed." }, { status: 500 });
  }
}
