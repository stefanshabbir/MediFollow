
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://figlerqhziwbzjbohohv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xlcnFoeml3YnpqYm9ob2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0NTcyMCwiZXhwIjoyMDc4OTIxNzIwfQ.SVOw3lhrpebQmMF1rFXpZYrAAimZMVnr3JSQeDp51Kk';

async function cleanup() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Fetching profiles...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, full_name, role');

    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    // We can't easily list all auth users with admin client in one go without pagination if there are many, 
    // but for this debug scale it's fine.
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();

    if (uError) {
        console.error('Error fetching auth users:', uError);
        return;
    }

    const authUserIds = new Set(users.map(u => u.id));
    console.log(`Found ${users.length} auth users.`);

    const orphaned = profiles.filter(p => !authUserIds.has(p.id));

    if (orphaned.length > 0) {
        console.log(`Found ${orphaned.length} orphaned profiles:`);
        orphaned.forEach(p => console.log(`- ${p.full_name} (${p.role}) ID: ${p.id}`));

        // START CLEANUP
        // Delete orphaned profiles
        const orphanedIds = orphaned.map(p => p.id);
        const { error: delError } = await supabase.from('profiles').delete().in('id', orphanedIds);

        if (delError) {
            console.error('Error deleting orphaned profiles:', delError);
        } else {
            console.log('Successfully deleted orphaned profiles.');
        }
    } else {
        console.log('No orphaned profiles found.');
    }

}

cleanup();
