import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessagesColumns() {
  console.log('Checking messages table columns...');
  try {
    // Try to select news_id to see if it exists
    const { data, error } = await supabase
      .from('messages')
      .select('news_id')
      .limit(1);

    if (error) {
      console.error('Error querying messages:', error.message);
      if (error.message.includes('column "news_id" does not exist')) {
        console.log('HYPOTHESIS: The "news_id" column is missing in the messages table!');
      }
    } else {
      console.log('news_id column exists.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkMessagesColumns();
