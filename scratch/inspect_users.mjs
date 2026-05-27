import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co/';
const supabaseSecretKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, last_name, username, email, status')
    .limit(20);

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles with emails:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
