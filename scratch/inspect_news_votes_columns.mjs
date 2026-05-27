import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('--- Checking news table votes columns ---');
  const { data: newsItems, error: newsErr } = await supabase
    .from('news')
    .select('id, author_id, titulo, likes_count, up_votes_count')
    .limit(10);
  console.log('News columns inspection:', newsItems);
  console.log('Error:', newsErr);
}

run();
