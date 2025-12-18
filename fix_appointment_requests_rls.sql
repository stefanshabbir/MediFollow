-- Fix Appointment Requests RLS Policies

-- Enable RLS (idempotent)
alter table public.appointment_requests enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Patients can view their own appointment requests" on public.appointment_requests;
drop policy if exists "Doctors can view their appointment requests" on public.appointment_requests;
drop policy if exists "Admins can view organisation appointment requests" on public.appointment_requests;
drop policy if exists "Patients can create appointment requests" on public.appointment_requests;
drop policy if exists "Patients can update their pending appointment requests" on public.appointment_requests;
drop policy if exists "Doctors can update their appointment requests" on public.appointment_requests;
drop policy if exists "Admins can update organisation appointment requests" on public.appointment_requests;

-- Re-create Policies

-- Patients can view their own appointment requests
create policy "Patients can view their own appointment requests"
on public.appointment_requests
for select
to authenticated
using (
  auth.uid() = patient_id
);

-- Doctors can view appointment requests assigned to them
create policy "Doctors can view their appointment requests"
on public.appointment_requests
for select
to authenticated
using (
  auth.uid() = doctor_id
);

-- Admins can view all appointment requests in their organisation
create policy "Admins can view organisation appointment requests"
on public.appointment_requests
for select
to authenticated
using (
  organisation_id in (
    select organisation_id from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Patients can create appointment requests
create policy "Patients can create appointment requests"
on public.appointment_requests
for insert
to authenticated
with check (
  auth.uid() = patient_id
);

-- Patients can update their own pending appointment requests
create policy "Patients can update their pending appointment requests"
on public.appointment_requests
for update
to authenticated
using (
  auth.uid() = patient_id and status = 'pending'
)
with check (
  auth.uid() = patient_id and status in ('pending', 'rejected')
);

-- Doctors can update appointment requests assigned to them
create policy "Doctors can update their appointment requests"
on public.appointment_requests
for update
to authenticated
using (
  auth.uid() = doctor_id
)
with check (
  auth.uid() = doctor_id
);

-- Admins can update all appointment requests in their organisation
create policy "Admins can update organisation appointment requests"
on public.appointment_requests
for update
to authenticated
using (
  organisation_id in (
    select organisation_id from public.profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  organisation_id in (
    select organisation_id from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);
