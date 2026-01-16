-- Support for Clinical Notes (Rich Text) and Versioning

BEGIN;

-- Update medical_records table to support text notes
ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
ALTER COLUMN file_url DROP NOT NULL,
ALTER COLUMN file_name DROP NOT NULL;

-- Set existing records (which are file uploads) to 'finalized'
UPDATE public.medical_records 
SET status = 'finalized' 
WHERE file_url IS NOT NULL AND status = 'draft';

-- Create table for version history
CREATE TABLE IF NOT EXISTS public.medical_record_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,
    CONSTRAINT medical_record_versions_pkey PRIMARY KEY (id),
    CONSTRAINT medical_record_versions_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(id) ON DELETE CASCADE,
    CONSTRAINT medical_record_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Enable RLS on the new table
ALTER TABLE public.medical_record_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view versions of records they created or have access to
CREATE POLICY "Doctors can view versions of records they have access to" 
ON public.medical_record_versions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.medical_records mr 
        WHERE mr.id = medical_record_versions.medical_record_id 
    )
);

CREATE POLICY "Users can insert versions for their own actions"
ON public.medical_record_versions FOR INSERT
WITH CHECK (auth.uid() = created_by);

COMMIT;
