import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Checking platform_interests table...');
  const { data, error } = await supabase.from('platform_interests').select('*').limit(5);
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
