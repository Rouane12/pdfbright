import fs from "node:fs/promises";

const failures = [];

function fail(message) {
  failures.push(message);
}

async function text(file) {
  return fs.readFile(file, "utf8");
}

const layout = await text("src/app/layout.tsx");
const launchFixes = await text("src/app/m11-launch-fixes.css");
const sitemap = await text("src/app/sitemap.ts");
const robots = await text("src/app/robots.ts");
const processingPolicy = await text("src/lib/security/processing-policy.ts");
const analytics = await text("src/components/product-analytics.tsx");
const loginLayout = await text("src/app/login/layout.tsx");
const signupLayout = await text("src/app/signup/layout.tsx");
const accountLayout = await text("src/app/account/layout.tsx");

const globalHeaderCount = (layout.match(/<GlobalSiteHeader\s*\/>/g) || []).length;
if (globalHeaderCount !== 1) fail(`expected exactly one root GlobalSiteHeader render, found ${globalHeaderCount}`);
if (!layout.includes('import "./m11-launch-fixes.css";')) fail("M11 launch-fix stylesheet is not imported last in root layout");
if (!/\.site-header\s*\{[\s\S]*?display:\s*none\s*!important;?[\s\S]*?\}/m.test(launchFixes)) {
  fail("legacy homepage .site-header is not suppressed from rendering");
}

const searchRoutes = [
  "/clean-scanned-pdf",
  "/make-pdf-searchable",
  "/straighten-pdf",
  "/remove-blank-pages",
  "/compress-scanned-pdf",
  "/improve-scanned-pdf",
];
for (const route of searchRoutes) {
  if (!sitemap.includes(route)) fail(`sitemap is missing ${route}`);
}

if (!robots.includes('disallow: "/api/"')) fail("robots.ts must keep API routes out of crawling");
if (!robots.includes('sitemap: `${baseUrl}/sitemap.xml`')) fail("robots.ts must advertise the generated sitemap");

if (!processingPolicy.includes('CURRENT_PROCESSING_CLASS = "local"')) fail("current processing class must remain explicitly local for launch");
if (!processingPolicy.includes("SERVER_ASSISTED_PROCESSING_ENABLED = false")) fail("server-assisted document processing unexpectedly enabled");

for (const [name, source] of [
  ["login", loginLayout],
  ["signup", signupLayout],
  ["account", accountLayout],
]) {
  if (!/index:\s*false/.test(source)) fail(`${name} route must remain noindex`);
}

const forbiddenAnalyticsTokens = ["file.name", "filename:", "extracted_text", "ocr_content", "document_subject", "page_image"];
for (const token of forbiddenAnalyticsTokens) {
  if (analytics.toLowerCase().includes(token.toLowerCase())) fail(`analytics source contains forbidden document-content token: ${token}`);
}

if (failures.length) {
  console.error("M11 source audit failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("M11 source audit passed: launch invariants are intact.");
