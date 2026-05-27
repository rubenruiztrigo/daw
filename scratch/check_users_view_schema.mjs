
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIdUsersView() {
  const { data, error } = await supabase.schema('id').from('users_view').select('*').limit(1);
  if (error) {
    console.log('id.users_view not found or error:', error.message);
  } else {
    console.log('id.users_view exists! Columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty');
  }
  
  const { data: dataPublic, error: errorPublic } = await supabase.from('users_view').select('*').limit(1);
  if (errorPublic) {
    console.log('public.users_view not found or error:', errorPublic.message);
  } else {
    console.log('public.users_view exists! Columns:', dataPublic.length > 0 ? Object.keys(dataPublic[0]) : 'Empty');
  }
}

checkIdUsersView();
