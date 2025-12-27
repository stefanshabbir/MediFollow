create table public.profiles (
  id uuid not null default auth.uid (),
  role text not null,
  created_at timestamp with time zone not null default now(),
  organisation_id uuid null,
  full_name text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_organisation_id_fkey foreign KEY (organisation_id) references organisations (id)
) TABLESPACE pg_default;

create table public.organisations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint organisations_pkey primary key (id)
) TABLESPACE pg_default;

create table public.doctor_schedules (
  id uuid not null default gen_random_uuid (),
  doctor_id uuid not null,
  day_of_week integer not null,
  is_available boolean not null default true,
  start_time time without time zone not null default '09:00:00'::time without time zone,
  end_time time without time zone not null default '17:00:00'::time without time zone,
  break_start_time time without time zone null,
  break_end_time time without time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint doctor_schedules_pkey primary key (id),
  constraint doctor_schedules_doctor_id_day_of_week_key unique (doctor_id, day_of_week),
  constraint doctor_schedules_doctor_id_fkey foreign KEY (doctor_id) references auth.users (id) on delete CASCADE,
  constraint doctor_schedules_day_of_week_check check (
    (
      (day_of_week >= 0)
      and (day_of_week <= 6)
    )
  )
) TABLESPACE pg_default;

create table public.appointments (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  doctor_id uuid not null,
  organisation_id uuid not null,
  appointment_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  status text not null default 'pending'::text,
  notes text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  previous_appointment_id uuid null,
  constraint appointments_pkey primary key (id),
  constraint appointments_doctor_id_fkey foreign KEY (doctor_id) references auth.users (id) on delete CASCADE,
  constraint appointments_organisation_id_fkey foreign KEY (organisation_id) references organisations (id) on delete CASCADE,
  constraint appointments_patient_id_fkey foreign KEY (patient_id) references auth.users (id) on delete CASCADE,
  constraint appointments_previous_appointment_id_fkey foreign KEY (previous_appointment_id) references appointments (id) on delete set null,
  constraint appointments_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'cancelled'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists appointments_previous_appointment_id_idx on public.appointments using btree (previous_appointment_id) TABLESPACE pg_default;

create table public.appointment_requests (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  doctor_id uuid not null,
  organisation_id uuid not null,
  appointment_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  status text not null default 'pending'::text,
  notes text null,
  linked_appointment_id uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint appointment_requests_pkey primary key (id),
  constraint appointment_requests_doctor_id_fkey foreign KEY (doctor_id) references auth.users (id) on delete CASCADE,
  constraint appointment_requests_linked_appointment_id_fkey foreign KEY (linked_appointment_id) references appointments (id) on delete set null,
  constraint appointment_requests_organisation_id_fkey foreign KEY (organisation_id) references organisations (id) on delete CASCADE,
  constraint appointment_requests_patient_id_fkey foreign KEY (patient_id) references auth.users (id) on delete CASCADE,
  constraint appointment_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
