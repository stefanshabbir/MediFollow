-- Create organizations table
create table public.organizations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint organizations_pkey primary key (id)
);

-- Add organization_id to profiles table
alter table public.profiles
add column organization_id uuid references public.organizations (id);

-- Set up Row Level Security (RLS) for organizations
alter table public.organizations enable row level security;

-- Policy: Admins can view their own organization
create policy "Admins can view their own organization"
on public.organizations
for select
to authenticated
using (
  id in (
    select organization_id from public.profiles
    where id = auth.uid()
  )
);

-- Policy: Admins can update their own organization
create policy "Admins can update their own organization"
on public.organizations
for update
to authenticated
using (
  id in (
    select organization_id from public.profiles
    where id = auth.uid()
  )
);

-- Policy: Authenticated users can create organizations
create policy "Authenticated users can create organizations"
on public.organizations
for insert
to authenticated
with check (true);
