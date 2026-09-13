# Milestone 9 Checkpoint Status

## Auth foundation

Status: in progress

Completed:
- dedicated PDFBright Supabase project
- `profiles`, `subscriptions`, and `usage_counters` schema
- RLS enabled
- Supabase security advisor clean after hardening trigger execution
- Next.js Supabase SSR client utilities
- session refresh proxy
- passwordless email sign-in route
- auth confirmation endpoint
- protected account page
- sign-out flow

Remaining before this checkpoint is accepted:
- configure Vercel Supabase environment variables
- configure Supabase Site URL / redirect URLs and magic-link email template
- make homepage Sign in navigation live
- verify sign-in end to end in preview
- verify profile row creation and RLS behavior
- verify sign-out and anonymous cleanup regression

Later M9 work:
- pricing page finalization
- Lemon Squeezy product/price setup
- checkout
- verified webhooks
- server-side Pro entitlement updates
- billing self-service / cancellation
- Free vs Pro usage limits and larger allowances
- batch processing only if feasible
