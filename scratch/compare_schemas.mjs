
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function compareSchemas() {
  console.log('--- USERS_VIEW ---');
  const { data: uv, error: ue } = await supabase.from('users_view').select('*').limit(1);
  if (ue) console.error('Error users_view:', ue.message);
  else console.log('Columns:', uv.length > 0 ? Object.keys(uv[0]) : 'No data');

  console.log('\n--- PROFILES ---');
  const { data: p, error: pe } = await supabase.from('profiles').select('*').limit(1);
  if (pe) console.error('Error profiles:', pe.message);
  else console.log('Columns:', p.length > 0 ? Object.keys(p[0]) : 'No data');
}

compareSchemas();
