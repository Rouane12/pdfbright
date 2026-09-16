import { NextResponse } from "next/server";
import {
  captureServerAnalyticsEvent,
  captureServerException,
} from "@/lib/analytics/server";
import {
  billingPlanForPriceId,
  hasProAccess,
  verifyPaddleWebhookSignature,
} from "@/lib/billing/paddle";
import { getSupabaseAdminClient } from "@/lib/server/supabase";

export const runtime = "nodejs";

const subscriptionEvents = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.activated",
  "subscription.trialing",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "subscription.canceled",
]);

const transactionEvents = new Set(["transaction.completed"]);

type PaddleCustomData = {
  user_id?: string;
  plan?: string;
};

type PaddlePriceRef = {
  id?: string;
};

type PaddleSubscriptionData = {
  id?: string;
  status?: string;
  customer_id?: string;
  next_billed_at?: string | null;
  scheduled_change?: {
    effective_at?: string | null;
  } | null;
  custom_data?: PaddleCustomData | null;
  items?: Array<{
    price?: PaddlePriceRef | null;
  }>;
};

type PaddleTransactionData = {
  id?: string;
  status?: string;
  origin?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  currency_code?: string | null;
  custom_data?: PaddleCustomData | null;
  details?: {
    totals?: {
      total?: string | null;
    } | null;
  } | null;
};

type PaddleWebhookPayload = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleSubscriptionData | PaddleTransactionData;
};

function customUserId(data: { custom_data?: PaddleCustomData | null }) {
  const value = data.custom_data?.user_id;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function subscriptionPriceId(data: PaddleSubscriptionData) {
  for (const item of data.items ?? []) {
    const priceId = item.price?.id;
    if (typeof priceId === "string" && priceId.trim()) return priceId.trim();
  }
  return null;
}

async function resolveSubscriptionUserId(data: PaddleSubscriptionData) {
  const fromCustomData = customUserId(data);
  if (fromCustomData) return fromCustomData;

  if (!data.id) return null;

  const admin = getSupabaseAdminClient();
  const { data: existing, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("provider", "paddle")
    .eq("provider_subscription_id", data.id)
    .maybeSingle();

  if (error) throw error;
  return existing?.user_id?.trim() || null;
}

async function resolveTransactionUserId(data: PaddleTransactionData) {
  const fromCustomData = customUserId(data);
  if (fromCustomData) return fromCustomData;

  if (!data.subscription_id) return null;

  const admin = getSupabaseAdminClient();
  const { data: existing, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("provider", "paddle")
    .eq("provider_subscription_id", data.subscription_id)
    .maybeSingle();

  if (error) throw error;
  return existing?.user_id?.trim() || null;
}

async function handleTransactionCompleted(payload: PaddleWebhookPayload) {
  const data = payload.data as PaddleTransactionData | undefined;
  if (!data?.id || data.status !== "completed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  let analyticsUserId: string | null = null;

  try {
    const userId = await resolveTransactionUserId(data);
    if (!userId) {
      console.warn("Ignoring Paddle transaction without a PDFBright user mapping", {
        transactionId: data.id,
        subscriptionId: data.subscription_id,
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    analyticsUserId = userId;
    const analyticsProperties = {
      billing_provider: "paddle",
      transaction_id: data.id,
      subscription_id: data.subscription_id ?? null,
      amount: data.details?.totals?.total ?? null,
      currency: data.currency_code ?? null,
      test_mode: process.env.PADDLE_ENVIRONMENT !== "live",
    };

    if (data.origin === "subscription_recurring") {
      await captureServerAnalyticsEvent("subscription_renewed", userId, analyticsProperties);
    } else {
      await captureServerAnalyticsEvent("purchase_completed", userId, analyticsProperties);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PDFBright Paddle transaction analytics failed", {
      transactionId: data.id,
      error,
    });
    await captureServerException("webhook_payment", error, analyticsUserId, {
      step: "transaction.completed",
    });
    return NextResponse.json({ error: "Payment webhook processing failed." }, { status: 500 });
  }
}

async function handleSubscriptionEvent(payload: PaddleWebhookPayload) {
  const eventType = payload.event_type;
  const data = payload.data as PaddleSubscriptionData | undefined;

  if (!eventType || !data?.id || !data.customer_id || !data.status) {
    return NextResponse.json({ error: "Subscription webhook data is incomplete." }, { status: 400 });
  }

  const priceId = subscriptionPriceId(data);
  const pricePlan = billingPlanForPriceId(priceId);
  const customPlan = data.custom_data?.plan;
  const plan = pricePlan ?? (customPlan === "monthly" || customPlan === "yearly" ? customPlan : null);

  if (!pricePlan) {
    console.warn("Ignoring Paddle subscription for an unknown PDFBright price", {
      eventType,
      subscriptionId: data.id,
      priceId,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  let userId: string | null = null;

  try {
    userId = await resolveSubscriptionUserId(data);
    if (!userId) {
      console.warn("Ignoring Paddle subscription without PDFBright user_id", {
        eventType,
        subscriptionId: data.id,
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    const admin = getSupabaseAdminClient();
    const periodEnd = data.next_billed_at ?? data.scheduled_change?.effective_at ?? null;
    const now = new Date().toISOString();

    const { error: subscriptionError } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "paddle",
        provider_customer_id: data.customer_id,
        provider_subscription_id: data.id,
        status: data.status,
        current_period_end: periodEnd,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    if (subscriptionError) throw subscriptionError;

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        plan: hasProAccess(data.status) ? "pro" : "free",
        updated_at: now,
      })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    if (eventType === "subscription.canceled") {
      await captureServerAnalyticsEvent("subscription_cancelled", userId, {
        billing_provider: "paddle",
        plan,
        test_mode: process.env.PADDLE_ENVIRONMENT !== "live",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PDFBright Paddle subscription sync failed", {
      eventType,
      subscriptionId: data.id,
      error,
    });
    await captureServerException("webhook_subscription_sync", error, userId, {
      step: eventType,
    });
    return NextResponse.json({ error: "Webhook sync failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (!verifyPaddleWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: PaddleWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaddleWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const eventType = payload.event_type;
  if (!eventType) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (transactionEvents.has(eventType)) {
    return handleTransactionCompleted(payload);
  }

  if (subscriptionEvents.has(eventType)) {
    return handleSubscriptionEvent(payload);
  }

  return NextResponse.json({ received: true, ignored: true });
}
