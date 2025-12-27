-- Fix Database Relationships for Appointments and Requests

-- Purpose:
-- The current Foreign Keys point to `auth.users`, but the application needs to fetch
-- `full_name` which exists in `public.profiles`.
-- By pointing the Foreign Keys to `public.profiles`, PostgREST can correctly join
-- and fetch the profile data including names.

BEGIN;

-- 1. Update appointment_requests table

-- Drop existing constraints to auth.users
ALTER TABLE public.appointment_requests
  DROP CONSTRAINT IF EXISTS appointment_requests_patient_id_fkey,
  DROP CONSTRAINT IF EXISTS appointment_requests_doctor_id_fkey;

-- Add new constraints to public.profiles
ALTER TABLE public.appointment_requests
  ADD CONSTRAINT appointment_requests_patient_id_fkey
    FOREIGN KEY (patient_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT appointment_requests_doctor_id_fkey
    FOREIGN KEY (doctor_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;


-- 2. Update appointments table (applying same fix for consistency)

-- Drop existing constraints to auth.users
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey,
  DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

-- Add new constraints to public.profiles
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT appointments_doctor_id_fkey
    FOREIGN KEY (doctor_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

COMMIT;

-- Note: This transaction assumes all users referenced in appointments have corresponding profiles.
-- If you get a foreign key violation, it means you have orphan appointments/requests (users without profiles).
-- You would need to delete those orphans or create profiles for them first.
