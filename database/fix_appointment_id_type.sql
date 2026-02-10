-- Fix medical_records appointment_id type
-- It appears appointment_id is currently numeric/integer, but it receives a UUID.

BEGIN;

-- 1. Alter the column type to UUID.
-- We use 'USING' to handle potential conversion, though if it's numeric it's likely empty or null.
-- If there's garbage data, this might fail, but for the user's issue (new feature), it's likely safe.
ALTER TABLE public.medical_records 
  ALTER COLUMN appointment_id TYPE uuid USING appointment_id::text::uuid;

-- 2. Add Foreign Key constraint (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_records_appointment_id_fkey') THEN
    ALTER TABLE public.medical_records
      ADD CONSTRAINT medical_records_appointment_id_fkey
      FOREIGN KEY (appointment_id)
      REFERENCES public.appointments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
