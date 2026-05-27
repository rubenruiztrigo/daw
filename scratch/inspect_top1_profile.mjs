import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('--- Inspecting Top 1 Author Profile ---');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'fefd0f25-d1ad-408c-a749-59eb0d554641')
    .single();
  console.log('Profile:', profile);
  console.log('Error:', error);

  console.log('--- Checking notifications for this user ---');
  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', 'fefd0f25-d1ad-408c-a749-59eb0d554641')
    .order('created_at', { ascending: false });
  console.log('Notifications for top 1:', notifs);
}

run();
