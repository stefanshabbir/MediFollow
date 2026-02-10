
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://figlerqhziwbzjbohohv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0NTcyMCwiZXhwIjoyMDc4OTIxNzIwfQ.SVOw3lhrpebQmMF1rFXpZYrAAimZMVnr3JSQeDp51Kk';

async function checkSchema() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('--- Checking doctor_sessions table ---');
    const { error: sessionError } = await supabase.from('doctor_sessions').select('*').limit(1);
    if (sessionError) {
        console.log('doctor_sessions table error:', sessionError.message);
    } else {
        console.log('doctor_sessions table exists.');
    }

    console.log('--- Checking appointments table columns ---');
    // Intentionally try to select session_id to see if it errors
    const { error: columnError } = await supabase.from('appointments').select('id, session_id').limit(1);
    if (columnError) {
        console.log('appointments selection error:', columnError.message);
    } else {
        console.log('appointments table has session_id column.');
    }
}

checkSchema();
