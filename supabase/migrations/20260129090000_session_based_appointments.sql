-- Create doctor_sessions table
CREATE TABLE IF NOT EXISTS doctor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER DEFAULT 15,
    label TEXT,
    status TEXT CHECK (status IN ('active', 'cancelled', 'completed')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for doctor_sessions
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor_date ON doctor_sessions(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_org ON doctor_sessions(organisation_id);

-- Add session columns to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES doctor_sessions(id),
ADD COLUMN IF NOT EXISTS session_label TEXT;

-- Add appointment_id to medical_records
ALTER TABLE medical_records
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);

-- Enable RLS on doctor_sessions
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for doctor_sessions
-- Allow view for authenticated users (patients need to see sessions to book)
CREATE POLICY "Authenticated users can view sessions"
ON doctor_sessions FOR SELECT
TO authenticated
USING (true);

-- Doctors can manage their own sessions
CREATE POLICY "Doctors can manage their own sessions"
ON doctor_sessions FOR ALL
TO authenticated
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- Admins can manage organisation sessions
CREATE POLICY "Admins can manage organisation sessions"
ON doctor_sessions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.organisation_id = doctor_sessions.organisation_id
    )
);
