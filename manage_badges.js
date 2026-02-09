
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseServiceKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv'; // Using anon key as found in source

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manageBadges() {
    console.log("--- Listing Ranking Badges ---");

    // 1. List all ranking badges to identify the one to remove
    // We look for 'ranking_top1' created in late Jan / early Feb (Week 5 Jan)
    const { data: badges, error } = await supabase
        .from('user_badges')
        .select('*, profiles(name, email)')
        .like('badge_id', 'ranking%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error listing badges:", error);
    } else {
        console.log(`Found ${badges.length} ranking badges.`);
        badges.forEach(b => {
            console.log(`[${b.id}]User: ${b.profiles?.name || b.user_id} | Badge: ${b.badge_id} | Date: ${b.created_at} `);
        });
    }

    // 2. Trigger Weekly Assignment
    console.log("\n--- Triggering Weekly Assignment ---");
    const { error: rpcError } = await supabase.rpc('assign_weekly_ranking_badges');

    if (rpcError) {
        console.error("Error calling RPC:", rpcError);
    } else {
        console.log("Weekly assignment triggered successfully.");
    }
}

manageBadges();
