create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (char_length(email) between 3 and 150),
  phone text check (phone is null or char_length(phone) <= 30),
  enquiry_type text not null check (enquiry_type in (
    'Farmer / product enquiry',
    'Dealer bulk supply',
    'Distributor partnership',
    'Other'
  )),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed'))
);

alter table public.contact_submissions enable row level security;
revoke all on table public.contact_submissions from public, anon, authenticated;
grant all on table public.contact_submissions to service_role;
create policy "Service role manages contact submissions"
  on public.contact_submissions
  for all
  to service_role
  using (true)
  with check (true);
