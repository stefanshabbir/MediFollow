
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://figlerqhziwbzjbohohv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0NTcyMCwiZXhwIjoyMDc4OTIxNzIwfQ.SVOw3lhrpebQmMF1rFXpZYrAAimZMVnr3JSQeDp51Kk';

const createSessionsTable = `
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

create index if not exists doctor_sessions_doctor_id_date_idx on public.doctor_sessions using btree (doctor_id, date) TABLESPACE pg_default;
`;

const updateAppointmentsTable = `
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'session_id') then
    alter table public.appointments add column session_id uuid null references public.doctor_sessions(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'session_label') then
    alter table public.appointments add column session_label text null;
  end if;
end $$;
`;

async function runMigration() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Creating doctor_sessions table...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createSessionsTable });
    // Note: rpc 'exec_sql' requires a custom function in database. 
    // If not available, we can't run DDL via JS client easily without it.
    // Standard Supabase JS client doesn't support raw SQL query execution for DDL.

    // Alternative: We can try to use a Postgres client (pg) if we had connection string.
    // But we only have API URL and Key.
    // WE MUST PROVIDE THE SQL TO THE USER TO RUN IN DASHBOARD SQL EDITOR if we can't run it here.

    // Let's check if we can assume the user can run SQL.
    // The user asked "please give me an sql script if i need one".
    // So generating the SQL file is the correct approach.

    console.log('Migration script prepared. Please run "database/add_sessions.sql" in your Supabase SQL Editor.');
}

// runMigration();
// Commented out because we can't actually run DDL from here without a helper function.
// We will write the SQL file instead.
