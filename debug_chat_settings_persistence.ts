
import { createClient } from '@supabase/supabase-js';

// Using the same credentials as inspect_profile_schema.ts
const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugChatSettings() {
    console.log("Debugging Chat Settings Persistence...");

    // 1. Check if column exists by inspecting a profile
    console.log("1. Inspecting profile schema...");
    const { data: profile, error: fetchError } = await supabase.from('profiles').select('*').limit(1);

    if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        return;
    }

    if (profile && profile.length > 0) {
        const p = profile[0];
        console.log("Profile keys:", Object.keys(p));
        console.log("chat_settings value:", p.chat_settings);

        if (!Object.keys(p).includes('chat_settings')) {
            console.error("CRITICAL: 'chat_settings' column NOT found in profile schema!");
        } else {
            console.log("SUCCESS: 'chat_settings' column found.");
        }
    } else {
        console.log("No profiles found to inspect.");
    }

    // 2. Try to update it (Simulating the action)
    // We can't easily update without a valid user session ID that allows updates.
    // But knowing if the column exists is step #1.
}

debugChatSettings();
