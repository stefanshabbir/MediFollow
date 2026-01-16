const { createClient } = require('@supabase/supabase-js');

const url = 'https://figlerqhziwbzjbohohv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDU3MjAsImV4cCI6MjA3ODkyMTcyMH0.2Dh6zRNkPl3uFImG1w05P3skhubB5g7QH32niUnIwqg';

const supabase = createClient(url, key);

async function test() {
    console.log('Testing Supabase Client connection to:', url);
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Supabase Error:', error.message);
            if (error.cause) console.error('Cause:', error.cause);
            console.log('Full Error:', error);
        } else {
            console.log('Success (User null is expected if no session):', data);
        }
    } catch (err) {
        console.error('Runtime Error:', err);
    }
}
test();
