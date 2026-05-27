import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('--- Inspecting cron jobs via RPC ---');
  const { data: jobs, error: jobsErr } = await supabase.rpc('inspect_cron_jobs');
  console.log('Jobs:', jobs);
  console.log('Jobs Error:', jobsErr);

  console.log('\n--- Inspecting cron runs via RPC ---');
  const { data: runs, error: runsErr } = await supabase.rpc('inspect_cron_runs');
  console.log('Runs:', runs);
  console.log('Runs Error:', runsErr);
}

run();
