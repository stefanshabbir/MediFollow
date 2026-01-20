-- Create diagnoses table
create table public.diagnoses (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create treatment_templates table
create table public.treatment_templates (
  id uuid default gen_random_uuid() primary key,
  diagnosis_id uuid references public.diagnoses(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create treatment_template_steps table
create table public.treatment_template_steps (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.treatment_templates(id) on delete cascade not null,
  step_order integer not null,
  title text not null,
  appointment_type text not null, -- e.g., 'consultation', 'checkup', 'test'
  suggested_time_gap interval, -- e.g., '7 days'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(template_id, step_order)
);

-- Create patient_treatment_plans table
create table public.patient_treatment_plans (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references auth.users(id) on delete cascade not null,
  doctor_id uuid references auth.users(id) on delete cascade not null,
  diagnosis_id uuid references public.diagnoses(id) on delete cascade not null,
  template_id uuid references public.treatment_templates(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create treatment_plan_appointments table 
-- Links a specific step in a patient's plan to an actual appointment
create table public.treatment_plan_appointments (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.patient_treatment_plans(id) on delete cascade not null,
  step_id uuid references public.treatment_template_steps(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'skipped')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(plan_id, step_id)
);

-- RLS Policies

alter table public.diagnoses enable row level security;
alter table public.treatment_templates enable row level security;
alter table public.treatment_template_steps enable row level security;
alter table public.patient_treatment_plans enable row level security;
alter table public.treatment_plan_appointments enable row level security;

-- Everyone can read diagnoses and templates (simplified for now)
create policy "Everyone can read diagnoses" on public.diagnoses for select to authenticated using (true);
create policy "Everyone can read templates" on public.treatment_templates for select to authenticated using (true);
create policy "Everyone can read steps" on public.treatment_template_steps for select to authenticated using (true);

-- Admins can manage diagnoses
create policy "Admins can manage diagnoses"
on public.diagnoses
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Admins can manage treatment templates
create policy "Admins can manage templates"
on public.treatment_templates
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Admins can manage template steps
create policy "Admins can manage steps"
on public.treatment_template_steps
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Doctors can create/update treatment plans
create policy "Doctors can manage treatment plans"
on public.patient_treatment_plans
for all
to authenticated
using (auth.uid() = doctor_id)
with check (auth.uid() = doctor_id);

-- Patients can view their own treatment plans
create policy "Patients can view their own plans"
on public.patient_treatment_plans
for select
to authenticated
using (auth.uid() = patient_id);

-- Access for treatment_plan_appointments
create policy "Users can view own plan appointments"
on public.treatment_plan_appointments
for select
to authenticated
using (
  exists (
    select 1 from public.patient_treatment_plans p
    where p.id = treatment_plan_appointments.plan_id
    and (p.patient_id = auth.uid() or p.doctor_id = auth.uid())
  )
);

-- Doctors can manage plan appointments
create policy "Doctors can manage plan appointments"
on public.treatment_plan_appointments
for all
to authenticated
using (
  exists (
    select 1 from public.patient_treatment_plans p
    where p.id = treatment_plan_appointments.plan_id
    and p.doctor_id = auth.uid()
  )
);

-- Seed Data (Example)
insert into public.diagnoses (name, description) values
('Type 2 Diabetes', 'Chronic condition that affects the way the body processes blood (sugar).'),
('Hypertension', 'High blood pressure.');

-- Add template for Diabetes (we need to do this dynamically in a script usually, but for schema file we can just structure it. 
-- In practice, we'll likely INSERT after creation or via admin UI.)
