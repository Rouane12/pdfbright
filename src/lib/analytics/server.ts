import { PostHog } from "posthog-node";

export type ServerAnalyticsEventName =
  | "purchase_completed"
  | "subscription_renewed"
  | "subscription_cancelled";

type ServerAnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export async function captureServerAnalyticsEvent(
  event: ServerAnalyticsEventName,
  distinctId: string,
  properties: ServerAnalyticsProperties = {},
) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return;

  const client = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId,
      event,
      properties: Object.fromEntries(
        Object.entries({
          ...properties,
          source: "server",
        }).filter(([, value]) => value !== undefined),
      ),
    });

    await client.shutdown();
  } catch (error) {
    console.warn("PDFBright server analytics capture failed", {
      event,
      error,
    });
  }
}
