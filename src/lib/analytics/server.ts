import { PostHog } from "posthog-node";

export type ServerAnalyticsEventName =
  | "pricing_cta_clicked"
  | "checkout_started"
  | "purchase_completed"
  | "subscription_renewed"
  | "subscription_cancelled";

export type ServerExceptionStage =
  | "billing_checkout"
  | "billing_portal"
  | "webhook_payment"
  | "webhook_subscription_sync";

type ServerAnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type ServerExceptionDetails = {
  step?: string;
};

function createServerAnalyticsClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return null;

  return new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });
}

function safeExceptionLabel(value: string | undefined) {
  if (!value || !/^[a-z0-9:_-]{1,64}$/i.test(value)) return "unexpected";
  return value;
}

function buildSanitizedException(error: unknown, stage: ServerExceptionStage) {
  const safeError = new Error(`PDFBright ${stage.replaceAll("_", " ")} failed`);
  safeError.name = "PDFBrightServerError";

  // Keep code frames for debugging while removing the original exception message.
  // Billing/provider/database messages can contain customer or request details.
  if (error instanceof Error && error.stack) {
    const [, ...frames] = error.stack.split("\n");
    if (frames.length > 0) {
      safeError.stack = `${safeError.name}: ${safeError.message}\n${frames.join("\n")}`;
    }
  }

  return safeError;
}

export async function captureServerAnalyticsEvent(
  event: ServerAnalyticsEventName,
  distinctId: string,
  properties: ServerAnalyticsProperties = {},
) {
  const client = createServerAnalyticsClient();
  if (!client) return;

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

export async function captureServerException(
  stage: ServerExceptionStage,
  error: unknown,
  distinctId?: string | null,
  details: ServerExceptionDetails = {},
) {
  const client = createServerAnalyticsClient();
  if (!client) return;

  const safeStep = safeExceptionLabel(details.step);
  const analyticsDistinctId = distinctId || "pdfbright-server";

  try {
    client.captureException(buildSanitizedException(error, stage), analyticsDistinctId, {
      stage,
      step: safeStep,
      source: "server",
      handled: true,
      $exception_fingerprint: `pdfbright:${stage}:${safeStep}`,
      $issue_name: `PDFBright ${stage.replaceAll("_", " ")} error`,
      ...(distinctId ? {} : { $process_person_profile: false }),
    });

    await client.shutdown();
  } catch (monitoringError) {
    console.warn("PDFBright server exception capture failed", {
      stage,
      monitoringError,
    });
  }
}
