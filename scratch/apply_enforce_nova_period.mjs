import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const sqlPath = path.join(process.cwd(), 'supabase', 'enforce_nova_period.sql');
  console.log('Reading SQL file from:', sqlPath);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Calling exec_sql RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Error applying SQL:', error);
  } else {
    console.log('SQL applied successfully!', data);
  }
}

run();
