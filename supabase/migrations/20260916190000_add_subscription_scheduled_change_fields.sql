-- Track billing-provider scheduled subscription changes so the account UI can
-- explain end-of-period cancellation without revoking paid access early.
alter table public.subscriptions
  add column if not exists scheduled_change_action text,
  add column if not exists scheduled_change_at timestamptz;

comment on column public.subscriptions.scheduled_change_action is
  'Billing-provider scheduled subscription action, such as cancel, pause, or resume.';
comment on column public.subscriptions.scheduled_change_at is
  'When the scheduled subscription action is expected to take effect.';
