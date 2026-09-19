# Free Early Access Launch

**Decision date:** 2026-09-19

PDFBright will launch publicly as a free Early Access product while Paddle Live verification remains blocked by an external proof-of-address process.

## Launch behavior

- Core PDF diagnosis and cleanup remains available without an account.
- Public pricing is presented as **Free Early Access**.
- Paid checkout and billing management fail closed on the server.
- Paddle.js is not loaded when billing is disabled.
- Existing Paddle/Supabase Pro implementation is preserved in the codebase rather than removed.
- Current free safety envelope remains 10 MB, 10 pages, and 3 OCR pages per document.

## Feature flags

Keep both flags false or unset for the free launch:

```env
BILLING_ENABLED=false
NEXT_PUBLIC_BILLING_ENABLED=false
```

Paid billing may be re-enabled only after:

1. Paddle Live verification is approved.
2. Production live credentials and price IDs are confirmed.
3. The production webhook endpoint is confirmed.
4. One intentional live checkout -> webhook -> entitlement -> portal -> cancellation lifecycle is verified.
5. Both billing flags are set to `true` and production is redeployed.

## Product reason

The product should not remain unpublished because of an external payment-verification delay. Early Access lets PDFBright gather real usage, search traffic, successful-download data, failure reports, and user feedback before monetization is switched on.
