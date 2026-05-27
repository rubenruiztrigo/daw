import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Calling process_weekly_ranking()...');
  const { data, error } = await supabase.rpc('process_weekly_ranking');
  if (error) {
    console.error('Error calling process_weekly_ranking:', error);
  } else {
    console.log('Result:', data);
  }
}

run();
