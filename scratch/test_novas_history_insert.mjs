import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase
    .from('novas_history')
    .insert({
      user_id: 'fefd0f25-d1ad-408c-a749-59eb0d554641',
      novas: 0,
      motivo: 'test-inspect'
    })
    .select();
  
  console.log('Result:', data);
  console.log('Error:', error);

  if (data && data.length > 0) {
    // Delete it right away
    await supabase.from('novas_history').delete().eq('id', data[0].id);
    console.log('Cleaned up.');
  }
}

run();
