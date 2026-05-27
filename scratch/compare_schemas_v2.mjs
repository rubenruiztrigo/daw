
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getColumnInfo() {
  // Try to get view definition or columns via RPC if available, or just common knowledge from previous turn
  // Since I can't run arbitrary SQL easily without a specific RPC, I'll try to find where it's defined in the code or use the 'id' schema as seen before.
  
  console.log('--- PROFILES (information_schema) ---');
  // Usually we can't query information_schema directly with anon key unless allowed.
  // Let's try to just select 1 row from profiles even if empty, but use a trick to get columns if possible.
  
  const { data: p, error: pe } = await supabase.from('profiles').select('*').limit(0);
  if (pe) console.error('Error profiles:', pe.message);
  else console.log('Profiles Columns (from metadata/empty select):', p);

  console.log('\n--- USERS_VIEW (id schema) ---');
  const { data: uv, error: ue } = await supabase.schema('id').from('users_view').select('*').limit(1);
  if (ue) {
      console.error('Error users_view (id schema):', ue.message);
      // Try public schema again just in case
      const { data: uvp, error: uep } = await supabase.from('users_view').select('*').limit(1);
      if (uep) console.error('Error users_view (public schema):', uep.message);
      else console.log('Users View Columns (public):', uvp.length > 0 ? Object.keys(uvp[0]) : 'Empty');
  } else {
      console.log('Users View Columns (id):', uv.length > 0 ? Object.keys(uv[0]) : 'Empty');
  }
}

getColumnInfo();
