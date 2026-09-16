import posthog from "posthog-js";

export type AnalyticsEventName =
  | "landing_view"
  | "pricing_view"
  | "how_it_works_view"
  | "upload_started"
  | "upload_completed"
  | "analysis_started"
  | "analysis_completed"
  | "diagnosis_viewed"
  | "cleanup_started"
  | "cleanup_completed"
  | "download_clicked"
  | "pricing_cta_clicked"
  | "checkout_started"
  | "checkout_failed";

type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsCaptureOptions = {
  immediate?: boolean;
};

function analyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY && typeof window !== "undefined");
}

export function identifyAnalyticsUser(userId: string) {
  if (!analyticsEnabled() || !userId) return;
  posthog.identify(userId);
}

export function resetAnalyticsUser() {
  if (!analyticsEnabled()) return;
  posthog.reset();
}

export function captureAnalyticsEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {},
  options: AnalyticsCaptureOptions = {},
) {
  if (!analyticsEnabled()) return;

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );

  posthog.capture(
    event,
    safeProperties,
    options.immediate
      ? {
          // Force an immediate request, but keep PostHog's normal transport.
          // The pricing flow performs async auth/API work before navigation, so
          // sendBeacon is unnecessary and can be less observable in some browsers.
          send_instantly: true,
        }
      : undefined,
  );
}

export function fileSizeBucket(bytes: number) {
  const megabytes = bytes / (1024 * 1024);
  if (megabytes <= 1) return "0-1mb";
  if (megabytes <= 5) return "1-5mb";
  if (megabytes <= 10) return "5-10mb";
  if (megabytes <= 25) return "10-25mb";
  return "25mb+";
}
