import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert(payload) {
  console.log('Testing payload:', payload);
  const { data, error } = await supabase.from('badges').insert(payload).select();
  if (error) {
    console.log('Error:', error.message);
    return false;
  } else {
    console.log('Success! Inserted:', data);
    return true;
  }
}

async function run() {
  await testInsert({ id: 'test_badge_7', label: 'Test 7', category: 'ranking', nova_reward: 10, image_url: 'http://test.com' });
}

run();
