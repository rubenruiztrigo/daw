
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectColumns() {
  const { data, error } = await supabase.from('badges').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('Table exists but is empty. Standard inspect failed.');
    // Try to get one even if empty? Not easy with select *.
    // But I previously saw "Success, found: 0 rows".
  }
}

inspectColumns();
