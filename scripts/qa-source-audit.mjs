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
const checkoutRoute = await text("src/app/api/billing/checkout/route.ts");
const entitlementRoute = await text("src/app/api/account/entitlement/route.ts");
const entitlementClient = await text("src/lib/billing/processing-entitlement-client.ts");
const webhookRoute = await text("src/app/api/webhooks/lemon-squeezy/route.ts");

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

const apiDisallowPattern = /disallow\s*:\s*(?:["']\/api\/["']|\[\s*["']\/api\/["']\s*\])/m;
if (!apiDisallowPattern.test(robots)) fail("robots.ts must keep API routes out of crawling");
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

if (!checkoutRoute.includes("readBearerToken(request)")) fail("checkout must require a bearer token");
if (!checkoutRoute.includes("supabase.auth.getUser(accessToken)")) fail("checkout must verify the authenticated user server-side");
if (!entitlementRoute.includes("supabase.auth.getUser(accessToken)")) fail("entitlement must verify the authenticated user server-side");
if (!entitlementRoute.includes('.from("subscriptions")')) fail("entitlement must resolve plan from the server-side subscription record");
if (!entitlementClient.includes("return FREE_ENTITLEMENT")) fail("entitlement lookup must fail closed to Free");
if (!entitlementClient.includes("getProcessingAllowance(plan)")) fail("client processing limits must derive from the server-verified plan");

const signatureCheckIndex = webhookRoute.indexOf("verifyLemonWebhookSignature(rawBody, signature)");
const subscriptionWriteIndex = webhookRoute.indexOf('.from("subscriptions").upsert');
if (signatureCheckIndex < 0) fail("Lemon Squeezy webhook must verify its signature");
if (subscriptionWriteIndex < 0) fail("Lemon Squeezy webhook subscription write is missing");
if (signatureCheckIndex >= 0 && subscriptionWriteIndex >= 0 && signatureCheckIndex > subscriptionWriteIndex) {
  fail("Lemon Squeezy webhook must verify its signature before subscription writes");
}
if (!webhookRoute.includes("attributes.store_id !== getLemonStoreId()")) fail("webhook must reject/ignore unknown Lemon Squeezy stores");
if (!webhookRoute.includes("!isKnownVariant(attributes.variant_id)")) fail("webhook must reject/ignore unknown Lemon Squeezy variants");

if (failures.length) {
  console.error("M11 source audit failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("M11 source audit passed: launch invariants are intact.");