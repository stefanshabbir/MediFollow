-- Fix Medical Records Relationships
-- Run this script to correct the Foreign Key constraints if the table was created with the wrong references (auth.users)

BEGIN;

-- Drop existing constraints if they exist (to be safe)
ALTER TABLE public.medical_records
  DROP CONSTRAINT IF EXISTS medical_records_patient_id_fkey,
  DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey;

-- Add correct constraints referencing public.profiles
ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_patient_id_fkey
    FOREIGN KEY (patient_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_doctor_id_fkey
    FOREIGN KEY (doctor_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- Verify RLS (Optional, usually persists but good to ensure enablement)
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

COMMIT;

-- After running this, the query should be able to resolve:
-- doctor:profiles!doctor_id(full_name)
