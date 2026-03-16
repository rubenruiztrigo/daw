
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAvatars() {
  console.log('Fetching last 10 profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('username, name, avatar')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('Latest 10 profiles:');
  data.forEach(p => {
    console.log(`User: ${p.username} | Name: ${p.name} | Avatar: ${p.avatar}`);
  });
}

debugAvatars();
