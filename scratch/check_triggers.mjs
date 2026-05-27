import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('Checking database triggers for counters...');
  try {
    // We can query pg_trigger through a simple select if we had a function or direct access.
    // Let's check what tables exist and query post_likes, post_comments, etc. to see if we can get counts.
    const { data: posts, error: postsError } = await supabase.from('posts').select('id, likes_count, comments_count, reposts_count').limit(5);
    if (postsError) {
      console.error('Error querying posts:', postsError.message);
      return;
    }
    console.log('Sample Posts:', posts);

    const { count: likesCount, error: likesError } = await supabase.from('post_likes').select('id', { count: 'exact', head: true });
    console.log('Total post likes in database:', likesCount);

    const { count: commentsCount, error: commentsError } = await supabase.from('post_comments').select('id', { count: 'exact', head: true });
    console.log('Total post comments in database:', commentsCount);

    // Let's see what happens to the counts when we query pg_trigger or pg_proc.
    // Since we don't have direct SQL command tool, we can try running an RPC or querying pg tables via postgrest if RLS allows, but usually system catalog is disabled or hidden.
    // Let's run a custom RPC or check if we can query pg_trigger directly.
    const { data: triggers, error: trigError } = await supabase.from('pg_trigger').select('*').limit(5);
    if (trigError) {
      console.log('Cannot query pg_trigger directly via PostgREST (expected RLS):', trigError.message);
    } else {
      console.log('Triggers:', triggers);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTriggers();
