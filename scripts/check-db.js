
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://figlerqhziwbzjbohohv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0NTcyMCwiZXhwIjoyMDc4OTIxNzIwfQ.SVOw3lhrpebQmMF1rFXpZYrAAimZMVnr3JSQeDp51Kk';

async function check() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Checking doctor_schedules table...');
    const { data: schedules, error } = await supabase.from('doctor_schedules').select('*');

    if (error) {
        console.error('Error fetching schedules:', error);
        return;
    }

    console.log(`Found ${schedules.length} schedules.`);
    if (schedules.length > 0) {
        console.log('Sample schedule:', schedules[0]);
        // Check distribution of day_of_week
        const days = {};
        schedules.forEach(s => {
            days[s.day_of_week] = (days[s.day_of_week] || 0) + 1;
        });
        console.log('Schedules by day_of_week:', days);
    } else {
        console.log('Table is empty!');
    }

    // Check doctors
    const { data: doctors } = await supabase.from('profiles').select('id, full_name').eq('role', 'doctor');
    console.log(`Found ${doctors?.length} doctors.`);
    if (doctors?.length > 0) {
        console.log('Sample Doctor ID:', doctors[0].id);
        // Check if this doctor has a schedule
        const ds = schedules.find(s => s.doctor_id === doctors[0].id);
        console.log('Does this doctor have a schedule?', !!ds);
    }

    // Environment Check
    console.log('Environment Timezone Offset:', new Date().getTimezoneOffset());
    console.log('Current Date (Local):', new Date().toString());
    console.log('Day of week for 2023-10-27 (Friday):', new Date('2023-10-27').getDay());
}

check();
