import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co/';
const supabaseSecretKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, notification_settings')
    .eq('id', 'fefd0f25-d1ad-408c-a749-59eb0d554641')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Ruben settings:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
