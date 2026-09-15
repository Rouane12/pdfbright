import { NextResponse } from "next/server";
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
    attributes?: LemonSubscriptionAttributes;
  };
};

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

  if (!eventName || !subscriptionEvents.has(eventName)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (payload.data?.type !== "subscriptions" || !payload.data.id || !payload.data.attributes) {
    return NextResponse.json({ error: "Subscription webhook data is incomplete." }, { status: 400 });
  }

  const userId = payload.meta?.custom_data?.user_id?.trim();
  const attributes = payload.data.attributes;

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
