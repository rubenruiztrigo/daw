import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('ranking_history').select('*').limit(10);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Ranking history count (anon):', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
