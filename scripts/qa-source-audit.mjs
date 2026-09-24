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
const analyticsInit = await text("src/instrumentation-client.ts");
const privacyPage = await text("src/app/privacy/page.tsx");
const loginLayout = await text("src/app/login/layout.tsx");
const signupLayout = await text("src/app/signup/layout.tsx");
const accountLayout = await text("src/app/account/layout.tsx");
const authForm = await text("src/components/auth-form.tsx");
const accountPanel = await text("src/components/account-panel.tsx");
const checkoutRoute = await text("src/app/api/billing/checkout/route.ts");
const entitlementRoute = await text("src/app/api/account/entitlement/route.ts");
const entitlementClient = await text("src/lib/billing/processing-entitlement-client.ts");
const webhookRoute = await text("src/app/api/webhooks/paddle/route.ts");
const paddleBilling = await text("src/lib/billing/paddle.ts");
const paddleRuntime = await text("src/components/paddle-checkout-runtime.tsx");

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
  "/tools",
  "/tools/upload-readiness",
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

if (!authForm.includes("supabase.auth.signInWithOtp")) fail("existing-account email login must remain passwordless");
if (!authForm.includes("shouldCreateUser: false")) fail("login must not silently create a new account");
if (!authForm.includes("supabase.auth.signUp")) fail("signup must remain a distinct registration path");
if (!authForm.includes("makeUnmanagedSignupPassword()")) fail("email signup must keep its server-managed/random password strategy");
if (!authForm.includes("crypto.randomUUID()")) fail("unmanaged signup password must be generated from cryptographic randomness");
if (/type=["']password["']/.test(authForm)) fail("PDFBright auth UI must not expose a user-managed password field while launch auth is passwordless");

const forbiddenAnalyticsTokens = ["file.name", "filename:", "extracted_text", "ocr_content", "document_subject", "page_image"];
for (const token of forbiddenAnalyticsTokens) {
  if (analytics.toLowerCase().includes(token.toLowerCase())) fail(`analytics source contains forbidden document-content token: ${token}`);
}

if (analyticsInit.includes("posthog.init")) {
  if (!privacyPage.includes("PDFBright uses PostHog for limited product analytics")) {
    fail("privacy policy must disclose active PostHog analytics");
  }
  if (!privacyPage.includes("does not intentionally send document contents, filenames, OCR text, extracted text, or page images to analytics")) {
    fail("privacy policy must preserve the no-document-content analytics disclosure");
  }
  if (!privacyPage.includes("PostHog analytics uses browser local storage")) {
    fail("privacy policy must disclose PostHog localStorage persistence");
  }
  if (!privacyPage.includes("IP-derived approximate location")) {
    fail("privacy policy must disclose analytics IP-derived approximate location metadata");
  }
}

if (!analyticsInit.includes("autocapture: false")) fail("PostHog autocapture must remain disabled");
if (!analyticsInit.includes("capture_pageview: false")) fail("automatic PostHog pageview capture must remain disabled");
if (!analyticsInit.includes("capture_pageleave: false")) fail("automatic PostHog pageleave capture must remain disabled");
if (!analyticsInit.includes("disable_session_recording: true")) fail("PostHog session recording must remain disabled");

if (!checkoutRoute.includes("readBearerToken(request)")) fail("checkout must require a bearer token");
if (!checkoutRoute.includes("supabase.auth.getUser(accessToken)")) fail("checkout must verify the authenticated user server-side");
if (!checkoutRoute.includes("createPaddleCheckout")) fail("checkout must create a server-authoritative Paddle transaction");
if (!entitlementRoute.includes("supabase.auth.getUser(accessToken)")) fail("entitlement must verify the authenticated user server-side");
if (!entitlementRoute.includes('.from("subscriptions")')) fail("entitlement must resolve plan from the server-side subscription record");
if (!entitlementClient.includes("return FREE_ENTITLEMENT")) fail("entitlement lookup must fail closed to Free");
if (!entitlementClient.includes("getProcessingAllowance(plan)")) fail("client processing limits must derive from the server-verified plan");

if (!paddleBilling.includes('Authorization: `Bearer ${requireEnv("PADDLE_API_KEY")}`')) {
  fail("Paddle API calls must authenticate with the server-only API key");
}
if (!paddleBilling.includes('"https://sandbox-api.paddle.com"') || !paddleBilling.includes('"https://api.paddle.com"')) {
  fail("Paddle billing helper must keep sandbox and live API endpoints separate");
}
if (!paddleBilling.includes('"Paddle-Version": paddleApiVersion')) fail("Paddle API version should be pinned");
if (!paddleRuntime.includes("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN")) fail("Paddle.js must use the public client-side token");
if (paddleRuntime.includes("PADDLE_API_KEY")) fail("Paddle server API key must never appear in the client runtime");

const webhookPostIndex = webhookRoute.indexOf("export async function POST(request: Request)");
const signatureGuardIndex = webhookRoute.indexOf("if (!verifyPaddleWebhookSignature(rawBody, signature))", webhookPostIndex);
const transactionDispatchIndex = webhookRoute.indexOf("return handleTransactionCompleted(payload)", webhookPostIndex);
const subscriptionDispatchIndex = webhookRoute.indexOf("return handleSubscriptionEvent(payload)", webhookPostIndex);
const subscriptionWriteIndex = webhookRoute.indexOf('.from("subscriptions").upsert');
if (signatureGuardIndex < 0) fail("Paddle webhook must verify Paddle-Signature");
if (subscriptionWriteIndex < 0) fail("Paddle webhook subscription write is missing");
if (
  signatureGuardIndex >= 0 &&
  ((transactionDispatchIndex >= 0 && transactionDispatchIndex < signatureGuardIndex) ||
    (subscriptionDispatchIndex >= 0 && subscriptionDispatchIndex < signatureGuardIndex))
) {
  fail("Paddle webhook must verify its signature before dispatching event handlers");
}
if (!webhookRoute.includes("billingPlanForPriceId(priceId)")) fail("Paddle webhook must validate subscription prices against configured PDFBright prices");
if (!webhookRoute.includes('provider: "paddle"')) fail("Paddle webhook must persist Paddle as the billing provider");
if (!webhookRoute.includes("scheduled_change_action")) fail("Paddle webhook must persist scheduled subscription changes");
if (!webhookRoute.includes("scheduled_change_at")) fail("Paddle webhook must persist scheduled subscription change timing");
if (!accountPanel.includes("scheduled_change_action")) fail("account UI must load scheduled billing changes");
if (!accountPanel.includes("Cancels on")) fail("account UI must explain scheduled cancellation timing");

if (failures.length) {
  console.error("M11 source audit failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("M11 source audit passed: launch invariants are intact.");