-- Create doctor_schedules table
create table public.doctor_schedules (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references auth.users(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  is_available boolean default true not null,
  start_time time not null default '09:00:00',
  end_time time not null default '17:00:00',
  break_start_time time,
  break_end_time time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(doctor_id, day_of_week)
);

-- Create index for faster queries
create index doctor_schedules_doctor_id_idx on public.doctor_schedules(doctor_id);

-- Enable RLS
alter table public.doctor_schedules enable row level security;

-- RLS Policies

-- Doctors can view their own schedules
create policy "Doctors can view their own schedules"
on public.doctor_schedules
for select
to authenticated
using (
  auth.uid() = doctor_id
);

-- Anyone can view doctor schedules (for booking purposes)
create policy "Anyone can view doctor schedules for booking"
on public.doctor_schedules
for select
to authenticated
using (true);

-- Doctors can insert their own schedules
create policy "Doctors can create their own schedules"
on public.doctor_schedules
for insert
to authenticated
with check (
  auth.uid() = doctor_id
);

-- Doctors can update their own schedules
create policy "Doctors can update their own schedules"
on public.doctor_schedules
for update
to authenticated
using (
  auth.uid() = doctor_id
)
with check (
  auth.uid() = doctor_id
);

-- Doctors can delete their own schedules
create policy "Doctors can delete their own schedules"
on public.doctor_schedules
for delete
to authenticated
using (
  auth.uid() = doctor_id
);

-- Trigger to automatically update updated_at
create trigger set_doctor_schedules_updated_at
before update on public.doctor_schedules
for each row
execute function public.handle_updated_at();

-- Function to initialize default schedule for a doctor
create or replace function public.initialize_doctor_schedule(p_doctor_id uuid)
returns void as $$
begin
  -- Create Monday-Friday 9-5 schedule
  insert into public.doctor_schedules (doctor_id, day_of_week, is_available, start_time, end_time)
  values 
    (p_doctor_id, 1, true, '09:00:00', '17:00:00'), -- Monday
    (p_doctor_id, 2, true, '09:00:00', '17:00:00'), -- Tuesday
    (p_doctor_id, 3, true, '09:00:00', '17:00:00'), -- Wednesday
    (p_doctor_id, 4, true, '09:00:00', '17:00:00'), -- Thursday
    (p_doctor_id, 5, true, '09:00:00', '17:00:00'), -- Friday
    (p_doctor_id, 6, false, '09:00:00', '17:00:00'), -- Saturday (unavailable)
    (p_doctor_id, 0, false, '09:00:00', '17:00:00')  -- Sunday (unavailable)
  on conflict (doctor_id, day_of_week) do nothing;
end;
$$ language plpgsql security definer;
