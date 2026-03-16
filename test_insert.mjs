
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const badge = { id: 'test_badge', label: 'Test', description: 'Test', color: 'test', category: 'ranking' };
  const { error } = await supabase.from('badges').insert(badge);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success!');
  }
}

testInsert();
