import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFKs() {
  console.log('Checking news table foreign keys...');
  // Note: Standard Supabase client doesn't easily expose schema info.
  // We'll try to do a join and see if it fails.
  const { data, error } = await supabase
    .from('news')
    .select('id, author_id, profiles!author_id(id)')
    .limit(1);

  if (error) {
    console.error('FK Join Error:', error);
  } else {
    console.log('FK Join Success! Relationship exists.');
  }
}

checkFKs();
