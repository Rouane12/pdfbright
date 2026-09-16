# Milestone 9 — Auth Foundation

## Scope of this checkpoint

This checkpoint introduces PDFBright accounts without changing the anonymous PDF-cleanup flow.

Implemented:
- dedicated Supabase project for PDFBright
- minimal account/profile/subscription/usage schema
- Row Level Security on account-owned data
- server-controlled subscription entitlement records
- passwordless email sign-in
- cookie-based Supabase SSR session handling
- protected account page
- server-side sign-out

## Privacy boundary

Accounts store only account, entitlement and usage-counter data required for the SaaS layer.

Do not store in account tables:
- PDF document contents
- OCR text
- rendered page images
- filenames
- generated cleaned PDFs

The existing local document-processing architecture remains unchanged by this checkpoint.

## Entitlement rule

The client must never be trusted to decide whether a user is Pro. Subscription state is persisted server-side and will be updated from verified billing webhooks when checkout is introduced.

## Authentication UX

Authentication is optional for the core anonymous cleanup flow. Accounts exist for Pro entitlement, billing and usage allowances.

Initial sign-in method: passwordless email magic link.
