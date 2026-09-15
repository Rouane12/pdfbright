import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (key && host) {
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_capture_url_hashes: true,
    persistence: "localStorage",
  });
}
