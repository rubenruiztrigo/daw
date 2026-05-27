import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const rubenId = 'fefd0f25-d1ad-408c-a749-59eb0d554641';
  
  const { data: badges, error: error1 } = await supabase.from('user_badges').select('*').eq('user_id', rubenId);
  console.log('Ruben Badges:', badges);
  console.log('Badges Error:', error1);

  const { data: notifs, error: error2 } = await supabase.from('notifications').select('*').eq('user_id', rubenId).order('created_at', { ascending: false }).limit(5);
  console.log('Ruben Notifications:', notifs);
  console.log('Notifications Error:', error2);
}

run();
