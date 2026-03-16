
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertMinimal() {
  const badge = { id: 'test_minimal', label: 'Test Minimal', color: 'bg-blue-100' };
  const { error } = await supabase.from('badges').insert(badge);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success minimal insert!');
  }
}

testInsertMinimal();
