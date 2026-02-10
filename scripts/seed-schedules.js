
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://figlerqhziwbzjbohohv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0NTcyMCwiZXhwIjoyMDc4OTIxNzIwfQ.SVOw3lhrpebQmMF1rFXpZYrAAimZMVnr3JSQeDp51Kk';

async function seed() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Fetching doctors...');
    const { data: doctors, error: dError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'doctor');

    if (dError) {
        console.error('Error fetching doctors:', dError);
        return;
    }

    console.log(`Found ${doctors.length} doctors.`);

    for (const doctor of doctors) {
        // Check if schedule exists
        const { data: existing, error: sError } = await supabase
            .from('doctor_schedules')
            .select('id')
            .eq('doctor_id', doctor.id);

        if (sError) {
            console.error(`Error checking schedule for ${doctor.full_name}:`, sError);
            continue;
        }

        if (existing && existing.length > 0) {
            console.log(`Doctor ${doctor.full_name} (${doctor.id}) already has ${existing.length} schedule items.`);
            continue;
        }

        console.log(`Seeding default schedule for ${doctor.full_name} (${doctor.id})...`);

        // Create 7 days of schedule
        const scheduleItems = [];
        for (let i = 0; i <= 6; i++) {
            scheduleItems.push({
                doctor_id: doctor.id,
                day_of_week: i,
                is_available: true,
                start_time: '09:00:00',
                end_time: '17:00:00'
            });
        }

        const { error: insertError } = await supabase
            .from('doctor_schedules')
            .insert(scheduleItems);

        if (insertError) {
            console.error(`Failed to insert schedule for ${doctor.full_name}:`, insertError);
        } else {
            console.log(`Successfully added 7-day schedule for ${doctor.full_name}.`);
        }
    }
}

seed();
