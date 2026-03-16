
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getColumns() {
  // Try to use a query that might bypass some cache issues or give more info
  const { data, error } = await supabase.from('badges').select('*').limit(0);
  if (error) {
    console.error('Error:', error);
  } else {
    // This might not work if table is empty
    console.log('Success, table reachable.');
  }
}

getColumns();
