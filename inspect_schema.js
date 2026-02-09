
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    // Fallback to hardcoded if env fails (using values seen previously)
    const url = 'https://lobfoivjtkmewqhunnry.supabase.co';
    const key = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv'; // Anon key
    if (!url) process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://lobfoivjtkmewqhunnry.supabase.co',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv'
);

async function inspect() {
    console.log("--- Inspecting 'news' Table ---");
    const { data: news, error: newsError } = await supabase
        .from('news')
        .select('*')
        .limit(1);

    if (newsError) console.error("Error fetching news:", newsError);
    else if (news.length === 0) console.log("News table is empty.");
    else console.log("News columns:", Object.keys(news[0]));

    console.log("\n--- Inspecting 'news_votes' Table ---");
    const { data: votes, error: votesError } = await supabase
        .from('news_votes')
        .select('*')
        .limit(1);

    if (votesError) console.error("Error fetching news_votes:", votesError);
    else if (votes.length === 0) console.log("news_votes table is empty.");
    else console.log("news_votes columns:", Object.keys(votes[0]));
}

inspect();
