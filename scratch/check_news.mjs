import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Get count of news
  const { data: news, error } = await supabase.from('news').select('id, title:titulo, created_at, author_id, up_votes_count');
  if (error) {
    console.error('Error fetching news:', error);
    return;
  }
  console.log('Total news count:', news.length);
  console.log('News items:', JSON.stringify(news, null, 2));

  // Let's also check profiles
  const { data: profiles, error2 } = await supabase.from('profiles').select('id, name, last_name, username');
  if (error2) {
    console.error('Error fetching profiles:', error2);
    return;
  }
  console.log('Profiles count:', profiles.length);
  console.log('Profiles list:', JSON.stringify(profiles, null, 2));
}

run();
