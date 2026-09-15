-- PDFBright billing/auth table privileges
--
-- These grants make the database permissions required by the application
-- reproducible in fresh Supabase environments. Row Level Security policies
-- remain responsible for restricting authenticated-user access.

-- Ensure application roles can resolve objects in the public schema.
grant usage on schema public to authenticated, service_role;

-- Signed-in users read their own account/subscription state through RLS.
grant select on table public.profiles to authenticated;
grant select on table public.subscriptions to authenticated;

-- Server-side billing routes and Lemon Squeezy webhooks use the service role
-- to read and synchronize profile/subscription state.
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.subscriptions to service_role;
