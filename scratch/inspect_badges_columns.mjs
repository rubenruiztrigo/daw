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
  await testInsert({ id: 'test_badge_3', label: 'Test 3', category: 'ranking', image_url: 'http://test.com' });
  await testInsert({ id: 'test_badge_4', label: 'Test 4', category: 'ranking', novas: 10 });
  await testInsert({ id: 'test_badge_5', label: 'Test 5', category: 'ranking', cost_novas: 10 });
  await testInsert({ id: 'test_badge_6', label: 'Test 6', category: 'ranking', icon_name: 'Medal' });
}

run();
