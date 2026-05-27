import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: newsItems } = await supabase
    .from('news')
    .select('id, author_id, titulo, likes_count, up_votes_count, created_at')
    .order('created_at', { ascending: false });
  console.log('News items with dates:', newsItems);
}

run();
