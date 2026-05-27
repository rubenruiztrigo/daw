import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIdSchema() {
  console.log('Checking id.users table...');
  try {
    const { data, error } = await supabase
      .schema('id')
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error querying id.users:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('HYPOTHESIS: The "id" schema or "users" table is missing!');
      }
    } else {
      console.log('id.users table exists.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkIdSchema();
