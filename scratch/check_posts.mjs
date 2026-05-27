import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPosts() {
  console.log('Checking posts table...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, author_id, type, created_at, image_url');

    if (error) {
      console.error('Error querying posts:', error.message);
    } else {
      const postsWithImages = data.filter(p => p.image_url && p.image_url.length > 0);
      console.log(`Found ${data.length} posts total. ${postsWithImages.length} have images.`);
      console.log(JSON.stringify(postsWithImages, null, 2));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkPosts();
