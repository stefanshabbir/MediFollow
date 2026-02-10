
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://figlerqhziwbzjbohohv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0NTcyMCwiZXhwIjoyMDc4OTIxNzIwfQ.SVOw3lhrpebQmMF1rFXpZYrAAimZMVnr3JSQeDp51Kk';

async function checkAppointmentsSchema() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('--- Checking appointments table schema ---');
    // Just select some known columns and potential columns
    const { data, error } = await supabase.from('appointments').select('*').limit(1);

    if (error) {
        console.error('Error fetching appointments:', error.message);
    } else if (data && data.length > 0) {
        console.log('Keys found in appointment row:', Object.keys(data[0]));
    } else {
        console.log('No rows in appointments table to inspect keys.');
        // Try to select columns directly, error will tell us if they exist or not

        const { error: err1 } = await supabase.from('appointments').select('consultation_notes').limit(1);
        console.log('consultation_notes column status:', err1 ? 'Likely Missing (' + err1.message + ')' : 'Exists');

        const { error: err2 } = await supabase.from('appointments').select('diagnosis').limit(1);
        console.log('diagnosis column status:', err2 ? 'Likely Missing (' + err2.message + ')' : 'Exists');

        const { error: err3 } = await supabase.from('appointments').select('doctor_notes').limit(1);
        console.log('doctor_notes column status:', err3 ? 'Likely Missing (' + err3.message + ')' : 'Exists');
    }
}

checkAppointmentsSchema();
