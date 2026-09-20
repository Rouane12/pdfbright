# M12 Account Deletion Runbook

Date: 2026-09-20
Applies to: PDFBright Free Early Access

## Purpose

Use this runbook when a verified PDFBright user asks support to delete their PDFBright account data.

The public instructions live at `/data-deletion`. This runbook is the internal operational procedure. It does not change the public promise and must not be used to imply that Google, Facebook, Paddle, or another third party deletes records that it is independently required to retain.

## Current data model

PDFBright currently stores account-level application data in:

- `auth.users` — Supabase Auth identity
- `public.profiles` — plan/profile state
- `public.subscriptions` — billing/entitlement linkage
- `public.usage_counters` — account usage counters

PDFBright does not currently provide cloud PDF storage or a document library.

All three PDFBright-owned public tables have a foreign key to `auth.users(id)` with `ON DELETE CASCADE`. This was verified against the production database on 2026-09-20. Supabase-managed identities and sessions also cascade from the Auth user.

## Request verification

1. Require the request to come from the email address attached to the PDFBright account.
2. If the request cannot be confidently matched to an account, ask the requester to verify control before deleting anything.
3. Identify the exact Supabase Auth user and record its user ID for the deletion operation.
4. Never delete an account based only on a display name, forwarded message, or unrelated email address.

## Deletion procedure

1. In Supabase, open **Authentication → Users** and locate the verified user.
2. Confirm the user ID matches the account being deleted.
3. Delete the Auth user through the Supabase Dashboard. If this is automated later, use the server-side Supabase Admin API `auth.admin.deleteUser(userId)`; never expose the secret/service-role key to the browser.
4. Do not manually delete only the profile row and leave the Auth identity behind.
5. Do not delete the user's Google, Facebook, or other external identity-provider account. PDFBright controls only the PDFBright/Supabase side.
6. If paid billing is enabled in the future, review any active subscription before deletion and follow the billing-provider cancellation/refund procedure separately. Provider records may remain where required for tax, fraud, dispute, accounting, or legal obligations.

## Verification after deletion

Verify that the PDFBright-owned rows for the deleted user ID are gone:

```sql
select
  (select count(*) from public.profiles where user_id = '<deleted-user-id>') as profiles,
  (select count(*) from public.subscriptions where user_id = '<deleted-user-id>') as subscriptions,
  (select count(*) from public.usage_counters where user_id = '<deleted-user-id>') as usage_counters;
```

Expected result: all three counts are `0`.

The Auth user should no longer appear in **Authentication → Users**.

## Session behavior

Supabase notes that an already-issued access-token JWT can remain cryptographically valid until its expiry even after a user is deleted.

PDFBright mitigates this in two ways:

- Protected server routes validate the token with `supabase.auth.getUser(accessToken)`, which checks the user against Supabase Auth rather than trusting the JWT payload alone.
- The account page validates the current browser session with `supabase.auth.getUser()`; a 401/403 or missing user clears the local browser session.

Because the user's PDFBright-owned rows cascade away, a stale token also has no owned profile, subscription, or usage rows left to read through RLS.

## Completion

After verification:

1. Reply to the requester confirming that the PDFBright account data covered by the request has been deleted.
2. Do not claim that files on the requester's device were deleted.
3. Do not claim that an external identity provider or payment provider deleted independently retained records.
4. Keep only the support/audit evidence required to show that the request was handled; do not retain unnecessary account data merely for convenience.

## Launch evidence

As of 2026-09-20:

- RLS is enabled on `profiles`, `subscriptions`, and `usage_counters`.
- Read policies are scoped to `auth.uid() = user_id`.
- All three public account tables use `ON DELETE CASCADE` to `auth.users(id)`.
- PDFBright protected account/billing APIs use `supabase.auth.getUser(accessToken)`.
- The live product has no PDFBright cloud document library.
