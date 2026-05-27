import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScheduledMessages() {
  console.log('Checking scheduled_messages table...');
  try {
    const { error } = await supabase
      .from('scheduled_messages')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error querying scheduled_messages:', error.message);
      if (error.message.includes('relation "public.scheduled_messages" does not exist')) {
        console.log('HYPOTHESIS: The "scheduled_messages" table is MISSING!');
      }
    } else {
      console.log('scheduled_messages table exists.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkScheduledMessages();
