import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Trying to set username to null on profiles...');
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .update({ username: null })
    .eq('id', '4e78e76b-884b-4edf-9f05-5a631722908d')
    .select();

  console.log('Profile result:', profileData);
  console.log('Profile error:', profileErr);

  console.log('Trying to set username to null on id.users...');
  const { data: userData, error: userErr } = await supabase
    .schema('id')
    .from('users')
    .update({ username: null })
    .eq('id', '4e78e76b-884b-4edf-9f05-5a631722908d')
    .select();

  console.log('User result:', userData);
  console.log('User error:', userErr);
}

run();
