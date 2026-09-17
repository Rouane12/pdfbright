import { createHmac, timingSafeEqual } from "node:crypto";

export type BillingPlan = "monthly" | "yearly";
export type PaddleEnvironment = "sandbox" | "live";

const paddleApiVersion = "1";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getPaddleEnvironment(): PaddleEnvironment {
  // Temporary launch gate: Paddle Live is not approved yet. Keep every build on
  // Sandbox so Preview/Production aliases cannot accidentally hit Paddle Live
  // while we finish account/domain verification. Re-enable Live only after
  // verification is approved and we are ready for the final live-payment proof.
  return "sandbox";
}

function getPaddleApiBase() {
  return getPaddleEnvironment() === "live"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export function getPaddlePriceId(plan: BillingPlan) {
  return plan === "monthly"
    ? requireEnv("PADDLE_MONTHLY_PRICE_ID")
    : requireEnv("PADDLE_YEARLY_PRICE_ID");
}

export function billingPlanForPriceId(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;
  if (priceId === getPaddlePriceId("monthly")) return "monthly";
  if (priceId === getPaddlePriceId("yearly")) return "yearly";
  return null;
}

export function isKnownPaddlePriceId(priceId: string | null | undefined) {
  return billingPlanForPriceId(priceId) !== null;
}

export function hasProAccess(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

function paddleHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${requireEnv("PADDLE_API_KEY")}`,
    "Paddle-Version": paddleApiVersion,
  };
}

type PaddleErrorPayload = {
  error?: {
    code?: string;
    detail?: string;
  };
};

async function paddleJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getPaddleApiBase()}${path}`, {
    ...init,
    headers: paddleHeaders(),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & PaddleErrorPayload;

  if (!response.ok) {
    throw new Error(
      payload.error?.detail ??
        payload.error?.code ??
        `Paddle API request failed with status ${response.status}.`,
    );
  }

  return payload;
}

export async function createPaddleCheckout(input: {
  plan: BillingPlan;
  userId: string;
  checkoutUrl: string;
}) {
  const payload = await paddleJson<{
    data?: {
      id?: string;
      checkout?: { url?: string | null } | null;
    };
  }>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          price_id: getPaddlePriceId(input.plan),
          quantity: 1,
        },
      ],
      collection_mode: "automatic",
      custom_data: {
        user_id: input.userId,
        plan: input.plan,
      },
      checkout: {
        url: input.checkoutUrl,
      },
    }),
  });

  const checkoutUrl = payload.data?.checkout?.url;
  if (!checkoutUrl) {
    throw new Error("Paddle did not return a checkout URL.");
  }

  return {
    transactionId: payload.data?.id ?? null,
    checkoutUrl,
  };
}

export async function createPaddlePortalSession(input: {
  customerId: string;
  subscriptionId?: string | null;
}) {
  const payload = await paddleJson<{
    data?: {
      urls?: {
        general?: {
          overview?: string | null;
        };
      };
    };
  }>(`/customers/${encodeURIComponent(input.customerId)}/portal-sessions`, {
    method: "POST",
    body: JSON.stringify(
      input.subscriptionId
        ? {
            subscription_ids: [input.subscriptionId],
          }
        : {},
    ),
  });

  const portalUrl = payload.data?.urls?.general?.overview;
  if (!portalUrl) {
    throw new Error("Paddle did not return a customer portal URL.");
  }

  return portalUrl;
}

function parsePaddleSignature(signature: string) {
  const parts = signature.split(";");
  let timestamp: string | null = null;
  const hashes: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) continue;
    if (key === "ts") timestamp = value;
    if (key === "h1") hashes.push(value);
  }

  return { timestamp, hashes };
}

export function verifyPaddleWebhookSignature(
  rawBody: string,
  signature: string | null,
  toleranceSeconds = 5,
) {
  if (!signature) return false;

  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const { timestamp, hashes } = parsePaddleSignature(signature);
  if (!timestamp || hashes.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampNumber);
  if (ageSeconds > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return hashes.some((hash) => {
    const hashBuffer = Buffer.from(hash, "utf8");
    if (hashBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, hashBuffer);
  });
}
