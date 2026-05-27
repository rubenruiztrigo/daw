import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'novas_history' });
  console.log('inspect_table_columns for novas_history:', data);
  console.log('Error:', error);

  if (error) {
    // If RPC doesn't exist, try direct query via fn_execute_query
    const { data: qData, error: qError } = await supabase.rpc('fn_execute_query', {
      query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'novas_history';"
    });
    console.log('Direct information_schema query:', qData);
    console.log('Direct query error:', qError);
  }
}

run();
