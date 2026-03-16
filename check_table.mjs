
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  const { data, error } = await supabase.from('badges').select('id').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success, found:', data.length, 'rows');
  }
}

checkTable();
