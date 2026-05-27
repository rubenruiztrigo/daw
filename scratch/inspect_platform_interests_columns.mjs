import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'platform_interests' });
  if (error) {
    // If no RPC, let's query via postgres direct or check table metadata
    console.log('Error calling RPC get_table_info:', error);
    // Let's try inserting a dummy record and read it
    const { data: insData, error: insErr } = await supabase
      .from('platform_interests')
      .insert({ name: 'Innovación Pública' })
      .select();
    console.log('Insert result:', insData, insErr);
  } else {
    console.log('Table info:', data);
  }
}

run();
