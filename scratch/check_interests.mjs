import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInterests() {
  console.log('Checking profiles and interests...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, interests');

    if (error) {
      console.error('Error querying profiles:', error.message);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkInterests();
