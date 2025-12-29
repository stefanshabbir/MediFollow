-- Create appointments table
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references auth.users(id) on delete cascade not null,
  doctor_id uuid references auth.users(id) on delete cascade not null,
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'awaiting_payment', 'completed')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  payment_amount_cents integer not null default 0,
  currency text not null default 'LKR',
  payment_intent_id text,
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index appointments_patient_id_idx on public.appointments(patient_id);
create index appointments_doctor_id_idx on public.appointments(doctor_id);
create index appointments_organisation_id_idx on public.appointments(organisation_id);
create index appointments_date_idx on public.appointments(appointment_date);

-- Enable RLS
alter table public.appointments enable row level security;

-- RLS Policies

-- Patients can view their own appointments
create policy "Patients can view their own appointments"
on public.appointments
for select
to authenticated
using (
  auth.uid() = patient_id
);

-- Doctors can view appointments assigned to them
create policy "Doctors can view their appointments"
on public.appointments
for select
to authenticated
using (
  auth.uid() = doctor_id
);

-- Admins can view all appointments in their organisation
create policy "Admins can view organisation appointments"
on public.appointments
for select
to authenticated
using (
  organisation_id in (
    select organisation_id from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Patients can create appointments
create policy "Patients can create appointments"
on public.appointments
for insert
to authenticated
with check (
  auth.uid() = patient_id
);

-- Patients can update their own pending appointments
create policy "Patients can update their pending appointments"
on public.appointments
for update
to authenticated
using (
  auth.uid() = patient_id and status = 'pending'
)
with check (
  auth.uid() = patient_id and status in ('pending', 'cancelled')
);

-- Patients can mark awaiting payment appointments as paid
create policy "Patients can complete payment"
on public.appointments
for update
to authenticated
using (
  auth.uid() = patient_id and status = 'awaiting_payment'
)
with check (
  auth.uid() = patient_id and status in ('awaiting_payment', 'completed')
);

-- Doctors can update appointments assigned to them
create policy "Doctors can update their appointments"
on public.appointments
for update
to authenticated
using (
  auth.uid() = doctor_id
)
with check (
  auth.uid() = doctor_id
);

-- Admins can update all appointments in their organisation
create policy "Admins can update organisation appointments"
on public.appointments
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

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger set_updated_at
before update on public.appointments
for each row
execute function public.handle_updated_at();
