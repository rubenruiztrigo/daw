import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminAndPermissions() {
    console.log("Checking for 'novagob' user...");

    // 1. Check if 'novagob' exists
    const { data: adminUser, error: adminError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', 'novagob')
        .maybeSingle();

    if (adminError) {
        console.error("Error fetching admin user:", adminError);
        return;
    }

    if (!adminUser) {
        console.error("Admin user 'novagob' NOT FOUND.");
        console.log("This explains why notifications are not sent.");
        return;
    }

    console.log(`Admin user found: ${adminUser.username} (${adminUser.id})`);

    // 2. Try to insert a notification (simulating a new user) or check policies
    // Since we are running this script probably without a session/user context or with anon key, 
    // we can't fully test RLS as a "new user" unless we sign in.

    // Let's create a test user to simulate the flow
    const testEmail = `test_diag_${Date.now()}@example.com`;
    const testPassword = 'password123';

    console.log(`Creating test user ${testEmail}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
    });

    if (authError) {
        console.error("Error signing up test user:", authError);
        return;
    }

    const userId = authData.user?.id;
    if (!userId) {
        console.error("User created but no ID returned.");
        return;
    }
    console.log(`Test user created: ${userId}`);

    // Need to create profile usually, but RLS might block it if not handled by trigger or manually
    // But let's try to insert the notification directly as this user.

    console.log("Attempting to insert notification as test user...");

    const { error: notifError } = await supabase
        .from('notifications')
        .insert({
            user_id: adminUser.id, // Targetting admin
            type: 'registration_request',
            content: 'Test notification from diagnostic script',
            sender_id: userId,
            is_read: false
        });

    if (notifError) {
        console.error("FAILED to insert notification:", notifError);
        console.log("Likely RLS Issue. Recommendations:");
        console.log("1. Check 'notifications' table policies.");
        console.log("2. Ensure authenticated users can insert with 'sender_id' = auth.uid()");
        console.log("3. Ensure they can insert for ANY 'user_id' (recipient).");
    } else {
        console.log("SUCCESS: Notification inserted!");
    }

    // Cleanup (optional, but good practice if possible, though deleting user requires service role usually)
    console.log("Test complete.");
}

checkAdminAndPermissions();
