import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const sqlPath = path.join(process.cwd(), 'supabase', 'fix_counters_and_notifications_rls.sql');
  console.log('Reading SQL file from:', sqlPath);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Calling fn_execute_query RPC...');
  const { data, error } = await supabase.rpc('fn_execute_query', { query: sql });
  
  if (error) {
    console.error('Error applying SQL:', error);
  } else {
    console.log('SQL applied successfully!', data);
  }
}

run();
