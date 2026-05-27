import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Let's try to fetch cron jobs using a select or check if we can query pg_cron tables.
  // Note: cron tables are in a different schema 'cron', so they might not be accessible via standard PostgREST API
  // unless we write a database function or use the service role key.
  const { data, error } = await supabase.rpc('get_weekly_dates_test'); 
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
