
import { supabase } from './supabaseClient.ts';

async function checkBuckets() {
    const { data, error } = await supabase
        .storage
        .listBuckets();

    if (error) {
        console.log("Error listing buckets:", error.message);
    } else {
        console.log("Available Buckets:", data.map(b => b.name));
    }

    // Also check if 'messages' table has 'text' column just to be safe (it does).
}

checkBuckets();
