import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('--- Checking pg_proc for process_weekly_ranking ---');
  const { data: functions, error: fnError } = await supabase.rpc('inspect_function', { function_name: 'process_weekly_ranking' }).select('*');
  console.log('inspect_function result:', functions, fnError);

  console.log('\n--- Checking cron.job ---');
  // Since cron schema might not be accessible directly via REST API, let's see if we can check it
  const { data: cronJobs, error: cronError } = await supabase
    .from('cron.job')
    .select('*');
  console.log('cron.job result:', cronJobs, cronError);

  console.log('\n--- Checking user_badges table directly ---');
  const { data: badges, error: badgeError } = await supabase
    .from('user_badges')
    .select('*');
  console.log('user_badges count:', badges?.length);
  console.log('user_badges error:', badgeError);
}

run();
