
-- Create doctor_sessions table
create table if not exists public.doctor_sessions (
  id uuid not null default gen_random_uuid (),
  doctor_id uuid not null,
  date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  status text not null default 'active'::text,
  label text null,
  slot_duration_minutes integer not null default 15,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint doctor_sessions_pkey primary key (id),
  constraint doctor_sessions_doctor_id_fkey foreign KEY (doctor_id) references auth.users (id) on delete CASCADE,
  constraint doctor_sessions_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'cancelled'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Add index for performance
create index if not exists doctor_sessions_doctor_id_date_idx on public.doctor_sessions using btree (doctor_id, date) TABLESPACE pg_default;

-- Add session columns to appointments if they don't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'session_id') then
    alter table public.appointments add column session_id uuid null references public.doctor_sessions(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'session_label') then
    alter table public.appointments add column session_label text null;
  end if;
end $$;

-- Policies for doctor_sessions (RLS)
alter table public.doctor_sessions enable row level security;

-- Doctors can view their own sessions
create policy "Doctors can view own sessions"
on public.doctor_sessions for select
to authenticated
using ( auth.uid() = doctor_id );

-- Doctors can insert their own sessions
create policy "Doctors can insert own sessions"
on public.doctor_sessions for insert
to authenticated
with check ( auth.uid() = doctor_id );

-- Doctors can update their own sessions
create policy "Doctors can update own sessions"
on public.doctor_sessions for update
to authenticated
using ( auth.uid() = doctor_id );

-- Doctors can delete their own sessions
create policy "Doctors can delete own sessions"
on public.doctor_sessions for delete
to authenticated
using ( auth.uid() = doctor_id );

-- Patients can view active sessions (for availability checking)
create policy "Patients can view active sessions"
on public.doctor_sessions for select
to authenticated
using ( status = 'active' );
