import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test(queryStr) {
  console.log(`Testing query: ${queryStr}`);
  const { data, error } = await supabase.from('ranking_history').select(queryStr).limit(1);
  if (error) {
    console.error('Error:', error.message, '\nDetails:', error.details);
  } else {
    console.log('Success! Data:', JSON.stringify(data, null, 2));
  }
  console.log('--------------------------------------------------');
}

async function run() {
  await test('badge_id,created_at,user_id,profiles(id)');
  await test('badge_id,created_at,user_id,profiles!user_id(id)');
  await test('badge_id,created_at,user_id,user:profiles!user_id(id)');
  await test('badge_id,created_at,user_id,user:profiles!ranking_history_user_id_fkey(id)');
  await test('badge_id,created_at,user_id');
}

run();
