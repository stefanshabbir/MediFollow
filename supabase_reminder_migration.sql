-- Track reminder dispatch per appointment to avoid duplicate emails
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS appointments_reminder_sent_at_idx
    ON public.appointments(reminder_sent_at);
