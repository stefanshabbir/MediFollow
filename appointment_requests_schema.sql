-- Create appointment_requests table
create table public.appointment_requests (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references auth.users(id) on delete cascade not null,
  doctor_id uuid references auth.users(id) on delete cascade not null,
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  linked_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for faster queries
create index appointment_requests_patient_id_idx on public.appointment_requests(patient_id);
create index appointment_requests_doctor_id_idx on public.appointment_requests(doctor_id);
create index appointment_requests_organisation_id_idx on public.appointment_requests(organisation_id);
create index appointment_requests_status_idx on public.appointment_requests(status);
create index appointment_requests_date_idx on public.appointment_requests(appointment_date);

-- Enable RLS
alter table public.appointment_requests enable row level security;

-- RLS Policies

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

-- Trigger to automatically update updated_at
create trigger set_updated_at
before update on public.appointment_requests
for each row
execute function public.handle_updated_at();
