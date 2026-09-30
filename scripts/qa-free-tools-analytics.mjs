import fs from "node:fs/promises";

const failures = [];

function fail(message) {
  failures.push(message);
}

async function text(file) {
  return fs.readFile(file, "utf8");
}

const analytics = await text("src/components/product-analytics.tsx");
const analyticsClient = await text("src/lib/analytics/client.ts");

const expectedToolPaths = [
  "/tools/upload-readiness",
  "/tools/scan-quality",
  "/tools/before-you-send",
  "/tools/searchability",
  "/tools/page-consistency",
  "/tools/change-receipt",
];

const expectedToolIds = [
  "upload_readiness",
  "scan_quality",
  "before_send",
  "searchability",
  "page_consistency",
  "change_receipt",
];

const expectedEvents = [
  "free_tools_hub_viewed",
  "free_tool_opened",
  "free_tool_viewed",
  "free_tool_file_selected",
  "free_tool_analysis_started",
  "free_tool_analysis_completed",
  "free_tool_analysis_failed",
  "free_tool_core_cta_clicked",
];

for (const route of expectedToolPaths) {
  if (!analytics.includes(`\"${route}\"`)) {
    fail(`Free Tools analytics is missing route mapping for ${route}`);
  }
}

for (const toolId of expectedToolIds) {
  if (!analytics.includes(`\"${toolId}\"`)) {
    fail(`Free Tools analytics is missing tool id ${toolId}`);
  }
}

for (const event of expectedEvents) {
  if (!analyticsClient.includes(`\"${event}\"`)) {
    fail(`analytics event union is missing ${event}`);
  }
  if (!analytics.includes(`\"${event}\"`) && event !== "free_tool_analysis_failed") {
    fail(`product analytics does not capture ${event}`);
  }
}

if (!analytics.includes('captureAnalyticsEvent("free_tool_analysis_failed"')) {
  fail("product analytics does not capture free_tool_analysis_failed");
}

if (!analytics.includes('source: "tools_hub"')) {
  fail("tool-open events must preserve tools_hub attribution");
}
if (!analytics.includes('target: "core_cleanup"')) {
  fail("Free Tools core CTA events must preserve core_cleanup target attribution");
}
if (!analytics.includes('startToolRun("pair")')) {
  fail("Change Receipt must be measured as one paired comparison run");
}
if (!analytics.includes('file_role: role ?? undefined')) {
  fail("Change Receipt file selection must distinguish original/modified roles without filenames");
}
if (!analytics.includes("fileSizeBucket(file.size)")) {
  fail("Free Tools file size must be bucketed before analytics capture");
}
if (!analytics.includes("duration_bucket")) {
  fail("Free Tools completion/failure events should keep coarse duration buckets");
}
if (!analytics.includes("outcome: toolOutcome(freeToolId)")) {
  fail("Free Tools completion events must use a controlled categorical outcome");
}

const forbiddenTokens = [
  "file.name",
  "filename",
  "file_name",
  "exact_file_size",
  "extracted_text",
  "ocr_text",
  "ocr_content",
  "text_content",
  "page_image",
  "attachment_content",
  "document_subject",
  "innerText",
  "textContent",
];

for (const token of forbiddenTokens) {
  if (analytics.toLowerCase().includes(token.toLowerCase())) {
    fail(`Free Tools analytics contains forbidden sensitive token: ${token}`);
  }
}

if (failures.length) {
  console.error("Free Tools analytics QA failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(
  "Free Tools analytics QA passed: six tools, funnel events, pair handling, and privacy guardrails are intact.",
);
