-- Add previous_appointment_id to appointments table to link follow-ups
ALTER TABLE public.appointments 
ADD COLUMN previous_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Create index for faster lookups of follow-up chains
CREATE INDEX appointments_previous_appointment_id_idx ON public.appointments(previous_appointment_id);
