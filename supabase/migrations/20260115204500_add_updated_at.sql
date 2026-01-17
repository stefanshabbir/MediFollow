-- Add updated_at column to medical_records if it doesn't exist

ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update existing records to have a valid updated_at
UPDATE public.medical_records
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Make it not null after populating
ALTER TABLE public.medical_records
ALTER COLUMN updated_at SET NOT NULL;
