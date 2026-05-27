
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProfiles() {
  // Query information_schema
  const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'profiles' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select again but with more columns if possible
    console.log('RPC inspect_table_columns failed, trying direct select...');
    const { data: data2, error: error2 } = await supabase.from('profiles').select('*').limit(1);
    if (error2) {
       console.error('Direct select failed:', error2);
    } else if (data2 && data2.length > 0) {
       console.log('Columns:', Object.keys(data2[0]));
    } else {
       console.log('Table profiles is empty or not accessible.');
    }
  } else {
    console.log('Columns from RPC:', data);
  }
}

inspectProfiles();
