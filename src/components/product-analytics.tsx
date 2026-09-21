"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  captureAnalyticsEvent,
  identifyAnalyticsUser,
  resetAnalyticsUser,
} from "@/lib/analytics/client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const acquisitionLandingPaths = new Set([
  "/",
  "/clean-scanned-pdf",
  "/make-pdf-searchable",
  "/straighten-pdf",
  "/remove-blank-pages",
  "/compress-scanned-pdf",
  "/improve-scanned-pdf",
]);

export function ProductAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const supabase = getSupabaseBrowserClient();
    const entryPath = acquisitionLandingPaths.has(pathname) ? pathname : null;
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

    if (entryPath) {
      captureAnalyticsEvent("landing_view", { landing_path: entryPath });
    }

    type SectionEvent = "pricing_view" | "how_it_works_view";
    const seenSectionEvents = new Set<SectionEvent>();

    function captureSectionView(event: SectionEvent) {
      if (seenSectionEvents.has(event)) return;
      seenSectionEvents.add(event);
      // These section views can be followed immediately by a navigation CTA.
      // Flush them now rather than risking a queued event during page departure.
      captureAnalyticsEvent(event, {}, { immediate: true });
    }

    const sectionEvents = new Map<Element, SectionEvent>();
    const pricing = document.querySelector("#pricing");
    const howItWorks = document.querySelector("#how-it-works");
    if (pricing) sectionEvents.set(pricing, "pricing_view");
    if (howItWorks) sectionEvents.set(howItWorks, "how_it_works_view");

    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const event = sectionEvents.get(entry.target);
          if (event) captureSectionView(event);
          observer.unobserve(entry.target);
        }
      },
      {
        // Long responsive sections can never reach a large intersection ratio on
        // shorter viewports. A small threshold still means the section was
        // genuinely brought into view while working reliably across devices.
        threshold: 0.05,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    for (const section of sectionEvents.keys()) sectionObserver.observe(section);

    function captureHashSection() {
      if (window.location.hash === "#pricing") {
        captureSectionView("pricing_view");
      } else if (window.location.hash === "#how-it-works") {
        captureSectionView("how_it_works_view");
      }
    }

    window.addEventListener("hashchange", captureHashSection);
    const hashFrame = window.requestAnimationFrame(captureHashSection);

    return () => {
      authListener.subscription.unsubscribe();
      sectionObserver.disconnect();
      window.cancelAnimationFrame(hashFrame);
      window.removeEventListener("hashchange", captureHashSection);
    };
  }, [pathname]);

  return null;
}
