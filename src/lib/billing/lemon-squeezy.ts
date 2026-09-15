import { createHmac, timingSafeEqual } from "node:crypto";

const lemonApiBase = "https://api.lemonsqueezy.com/v1";

export type BillingPlan = "monthly" | "yearly";

export type LemonSubscriptionAttributes = {
  store_id: number;
  customer_id: number;
  variant_id: number;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  test_mode?: boolean;
  urls?: {
    customer_portal?: string | null;
    update_payment_method?: string | null;
  };
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function numericEnv(name: string) {
  const value = requireEnv(name);
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

export function getLemonStoreId() {
  return numericEnv("LEMON_SQUEEZY_STORE_ID");
}

export function getLemonVariantId(plan: BillingPlan) {
  return plan === "monthly"
    ? numericEnv("LEMON_SQUEEZY_MONTHLY_VARIANT_ID")
    : numericEnv("LEMON_SQUEEZY_YEARLY_VARIANT_ID");
}

export function isKnownVariant(variantId: number) {
  return (
    variantId === getLemonVariantId("monthly") ||
    variantId === getLemonVariantId("yearly")
  );
}

export function hasProAccess(status: string | null | undefined) {
  return Boolean(status && status !== "expired");
}

function lemonHeaders() {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${requireEnv("LEMON_SQUEEZY_API_KEY")}`,
  };
}

export async function createLemonCheckout(input: {
  plan: BillingPlan;
  userId: string;
  email: string;
  redirectUrl: string;
}) {
  const storeId = getLemonStoreId();
  const variantId = getLemonVariantId(input.plan);

  const response = await fetch(`${lemonApiBase}/checkouts`, {
    method: "POST",
    headers: lemonHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            enabled_variants: [variantId],
            redirect_url: input.redirectUrl,
          },
          checkout_data: {
            email: input.email,
            custom: {
              user_id: input.userId,
              plan: input.plan,
            },
          },
          test_mode: process.env.LEMON_SQUEEZY_TEST_MODE === "true",
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    data?: { attributes?: { url?: string } };
    errors?: Array<{ detail?: string; title?: string }>;
  };

  if (!response.ok) {
    const message =
      payload.errors?.[0]?.detail ??
      payload.errors?.[0]?.title ??
      "Lemon Squeezy could not create the checkout.";
    throw new Error(message);
  }

  const url = payload.data?.attributes?.url;

  if (!url) {
    throw new Error("Lemon Squeezy did not return a checkout URL.");
  }

  return url;
}

export async function retrieveLemonSubscription(subscriptionId: string) {
  const response = await fetch(`${lemonApiBase}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "GET",
    headers: lemonHeaders(),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: {
      id?: string;
      attributes?: LemonSubscriptionAttributes;
    };
    errors?: Array<{ detail?: string; title?: string }>;
  };

  if (!response.ok) {
    const message =
      payload.errors?.[0]?.detail ??
      payload.errors?.[0]?.title ??
      "Lemon Squeezy could not load the subscription.";
    throw new Error(message);
  }

  if (!payload.data?.attributes) {
    throw new Error("Lemon Squeezy returned an incomplete subscription response.");
  }

  return {
    id: payload.data.id ?? subscriptionId,
    attributes: payload.data.attributes,
  };
}

export function verifyLemonWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
