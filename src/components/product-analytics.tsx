"use client";

import { useEffect, useRef } from "react";
import {
  captureAnalyticsEvent,
  fileSizeBucket,
  identifyAnalyticsUser,
  resetAnalyticsUser,
} from "@/lib/analytics/client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function selectedPdfFromEvent(event: Event) {
  if (event.type === "change") {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.type === "file") {
      return input.files?.[0] ?? null;
    }
  }

  if (event instanceof DragEvent && event.type === "drop") {
    return event.dataTransfer?.files?.[0] ?? null;
  }

  return null;
}

export function ProductAnalytics() {
  const diagnosisSeenRef = useRef(false);
  const resultSeenRef = useRef(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (userId) identifyAnalyticsUser(userId);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetAnalyticsUser();
        return;
      }

      const userId = session?.user?.id;
      if (userId) identifyAnalyticsUser(userId);
    });

    if (window.location.pathname === "/") {
      captureAnalyticsEvent("landing_view");
    }

    const sectionEvents = new Map<Element, "pricing_view" | "how_it_works_view">();
    const pricing = document.querySelector("#pricing");
    const howItWorks = document.querySelector("#how-it-works");
    if (pricing) sectionEvents.set(pricing, "pricing_view");
    if (howItWorks) sectionEvents.set(howItWorks, "how_it_works_view");

    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const event = sectionEvents.get(entry.target);
          if (event) captureAnalyticsEvent(event);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.35 },
    );

    for (const section of sectionEvents.keys()) sectionObserver.observe(section);

    function markUploadStart(event: Event) {
      const file = selectedPdfFromEvent(event);
      if (!file || file.type !== "application/pdf") return;

      diagnosisSeenRef.current = false;
      resultSeenRef.current = false;
      const properties = {
        file_size_bucket: fileSizeBucket(file.size),
        local_vs_server: "local",
      };
      captureAnalyticsEvent("upload_started", properties);
      captureAnalyticsEvent("analysis_started", properties);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a");
      if (!control) return;

      if (control.classList.contains("result-download")) {
        captureAnalyticsEvent("download_clicked", { local_vs_server: "local" });
        return;
      }

      if (control.textContent?.trim() === "Fix My PDF") {
        captureAnalyticsEvent("cleanup_started", { local_vs_server: "local" });
      }
    }

    function inspectWorkflowState() {
      if (!diagnosisSeenRef.current && document.querySelector(".diagnosis-workspace")) {
        diagnosisSeenRef.current = true;
        captureAnalyticsEvent("upload_completed", { local_vs_server: "local" });
        captureAnalyticsEvent("analysis_completed", { local_vs_server: "local" });
        captureAnalyticsEvent("diagnosis_viewed", { local_vs_server: "local" });
      }

      if (!resultSeenRef.current && document.querySelector(".result-card")) {
        resultSeenRef.current = true;
        captureAnalyticsEvent("cleanup_completed", { local_vs_server: "local" });
      }
    }

    document.addEventListener("change", markUploadStart, true);
    document.addEventListener("drop", markUploadStart, true);
    document.addEventListener("click", handleClick, true);

    const workflowObserver = new MutationObserver(inspectWorkflowState);
    workflowObserver.observe(document.body, { childList: true, subtree: true });
    inspectWorkflowState();

    return () => {
      authListener.subscription.unsubscribe();
      sectionObserver.disconnect();
      workflowObserver.disconnect();
      document.removeEventListener("change", markUploadStart, true);
      document.removeEventListener("drop", markUploadStart, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
