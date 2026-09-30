"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  captureAnalyticsEvent,
  fileSizeBucket,
  identifyAnalyticsUser,
  resetAnalyticsUser,
} from "@/lib/analytics/client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type FreeToolId =
  | "upload_readiness"
  | "scan_quality"
  | "before_send"
  | "searchability"
  | "page_consistency"
  | "change_receipt";

type ChangeReceiptFileRole = "original" | "modified";

const freeToolPaths = new Map<string, FreeToolId>([
  ["/tools/upload-readiness", "upload_readiness"],
  ["/tools/scan-quality", "scan_quality"],
  ["/tools/before-you-send", "before_send"],
  ["/tools/searchability", "searchability"],
  ["/tools/page-consistency", "page_consistency"],
  ["/tools/change-receipt", "change_receipt"],
]);

const acquisitionLandingPaths = new Set([
  "/",
  "/clean-scanned-pdf",
  "/make-pdf-searchable",
  "/straighten-pdf",
  "/remove-blank-pages",
  "/compress-scanned-pdf",
  "/improve-scanned-pdf",
  "/tools",
  ...freeToolPaths.keys(),
]);

const completionSelectors: Record<FreeToolId, string> = {
  upload_readiness: "#readiness-report-heading",
  scan_quality: "#scan-quality-report-heading",
  before_send: "#before-send-report-heading",
  searchability: "#searchability-report-heading",
  page_consistency: "#consistency-report-heading",
  change_receipt: "#change-receipt-report-heading",
};

function isValidToolPdf(file: File) {
  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return looksLikePdf && file.size > 0 && file.size <= 50 * 1024 * 1024;
}

function changeReceiptRole(input: HTMLInputElement): ChangeReceiptFileRole | null {
  const label = input.getAttribute("aria-label")?.toLowerCase() ?? "";
  if (label.includes("original")) return "original";
  if (label.includes("modified")) return "modified";
  return null;
}

function durationBucket(startedAt: number | null) {
  if (startedAt === null) return "unknown";
  const elapsed = performance.now() - startedAt;
  if (elapsed < 1_000) return "under-1s";
  if (elapsed < 3_000) return "1-3s";
  if (elapsed < 10_000) return "3-10s";
  if (elapsed < 30_000) return "10-30s";
  return "30s+";
}

function toolOutcome(toolId: FreeToolId) {
  if (toolId === "upload_readiness") {
    const element = document.querySelector(".readiness-verdict");
    if (element?.classList.contains("readiness-verdict--pass")) return "pass";
    if (element?.classList.contains("readiness-verdict--warning")) return "review";
    if (element?.classList.contains("readiness-verdict--fail")) return "fail";
  }

  if (toolId === "scan_quality") {
    const element = document.querySelector(".quality-score-card");
    if (element?.classList.contains("quality-score-card--excellent")) return "excellent";
    if (element?.classList.contains("quality-score-card--good")) return "good";
    if (element?.classList.contains("quality-score-card--review")) return "review";
    if (element?.classList.contains("quality-score-card--poor")) return "poor";
  }

  if (toolId === "before_send") {
    const element = document.querySelector(".send-verdict");
    if (element?.classList.contains("send-verdict--clear")) return "clear";
    if (element?.classList.contains("send-verdict--review")) return "review";
    if (element?.classList.contains("send-verdict--attention")) return "attention";
  }

  if (toolId === "searchability") {
    const element = document.querySelector(".searchability-verdict");
    if (element?.classList.contains("searchability-verdict--fully-searchable")) {
      return "fully-searchable";
    }
    if (element?.classList.contains("searchability-verdict--partially-searchable")) {
      return "partially-searchable";
    }
    if (element?.classList.contains("searchability-verdict--not-searchable")) {
      return "not-searchable";
    }
    if (element?.classList.contains("searchability-verdict--no-content")) {
      return "no-content";
    }
  }

  if (toolId === "page_consistency") {
    const element = document.querySelector(".consistency-verdict");
    if (element?.classList.contains("consistency-verdict--consistent")) return "consistent";
    if (element?.classList.contains("consistency-verdict--review")) return "review";
    if (element?.classList.contains("consistency-verdict--mixed")) return "mixed";
  }

  if (toolId === "change_receipt") {
    const element = document.querySelector(".change-verdict");
    if (element?.classList.contains("change-verdict--changed")) return "changed";
    if (element?.classList.contains("change-verdict--same")) return "same";
  }

  return "unknown";
}

export function ProductAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const supabase = getSupabaseBrowserClient();
    const entryPath = acquisitionLandingPaths.has(pathname) ? pathname : null;
    const freeToolId = freeToolPaths.get(pathname) ?? null;

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

    if (pathname === "/tools") {
      captureAnalyticsEvent("free_tools_hub_viewed");
    } else if (freeToolId) {
      captureAnalyticsEvent("free_tool_viewed", { tool_id: freeToolId });
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

    let runSequence = 0;
    let completedSequence = 0;
    let failedSequence = 0;
    let runStartedAt: number | null = null;
    const receiptFiles = new Map<ChangeReceiptFileRole, string>();

    function startToolRun(inputMode: "single" | "pair") {
      if (!freeToolId) return;
      runSequence += 1;
      runStartedAt = performance.now();
      captureAnalyticsEvent("free_tool_analysis_started", {
        tool_id: freeToolId,
        input_mode: inputMode,
      });
    }

    function captureSelectedFile(file: File, role?: ChangeReceiptFileRole | null) {
      if (!freeToolId || !isValidToolPdf(file)) return;
      const sizeBucket = fileSizeBucket(file.size);
      captureAnalyticsEvent("free_tool_file_selected", {
        tool_id: freeToolId,
        file_size_bucket: sizeBucket,
        file_role: role ?? undefined,
      });

      if (freeToolId === "change_receipt") {
        if (!role) return;
        receiptFiles.set(role, sizeBucket);
        if (receiptFiles.has("original") && receiptFiles.has("modified")) {
          startToolRun("pair");
        }
        return;
      }

      startToolRun("single");
    }

    function captureToolInput(event: Event) {
      if (!freeToolId) return;
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
      const file = input.files?.[0];
      if (!file) return;
      captureSelectedFile(file, freeToolId === "change_receipt" ? changeReceiptRole(input) : null);
    }

    function captureToolDrop(event: DragEvent) {
      if (!freeToolId || freeToolId === "change_receipt") return;
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      captureSelectedFile(file);
    }

    function captureNavigation(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      if (pathname === "/tools") {
        const openedTool = freeToolPaths.get(href);
        if (openedTool) {
          captureAnalyticsEvent(
            "free_tool_opened",
            { tool_id: openedTool, source: "tools_hub" },
            { immediate: true },
          );
        }
      }

      if (freeToolId && href === "/#upload") {
        captureAnalyticsEvent(
          "free_tool_core_cta_clicked",
          { tool_id: freeToolId, target: "core_cleanup" },
          { immediate: true },
        );
      }
    }

    function inspectToolState() {
      if (!freeToolId || runSequence === 0) return;

      const completion = document.querySelector(completionSelectors[freeToolId]);
      if (completion && completedSequence !== runSequence) {
        completedSequence = runSequence;
        captureAnalyticsEvent("free_tool_analysis_completed", {
          tool_id: freeToolId,
          outcome: toolOutcome(freeToolId),
          duration_bucket: durationBucket(runStartedAt),
        });
        return;
      }

      const error = document.querySelector(".readiness-error[role='alert']");
      if (
        error &&
        failedSequence !== runSequence &&
        completedSequence !== runSequence
      ) {
        failedSequence = runSequence;
        captureAnalyticsEvent("free_tool_analysis_failed", {
          tool_id: freeToolId,
          error_surface: "tool_ui",
          duration_bucket: durationBucket(runStartedAt),
        });
      }
    }

    const toolObserver = freeToolId
      ? new MutationObserver(inspectToolState)
      : null;

    if (toolObserver) {
      toolObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
      document.addEventListener("change", captureToolInput, true);
      document.addEventListener("drop", captureToolDrop, true);
    }

    document.addEventListener("click", captureNavigation);

    return () => {
      authListener.subscription.unsubscribe();
      sectionObserver.disconnect();
      toolObserver?.disconnect();
      window.cancelAnimationFrame(hashFrame);
      window.removeEventListener("hashchange", captureHashSection);
      document.removeEventListener("click", captureNavigation);
      document.removeEventListener("change", captureToolInput, true);
      document.removeEventListener("drop", captureToolDrop, true);
    };
  }, [pathname]);

  return null;
}
