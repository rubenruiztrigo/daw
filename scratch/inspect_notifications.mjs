import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co/';
const supabaseSecretKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function run() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, created_at, type, user_id, sender_id, content, is_read, post_id, news_id')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications:', error);
  } else {
    console.log('Latest 20 notifications:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
