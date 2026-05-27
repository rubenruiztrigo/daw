import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const authorSelect = 'author:profiles!author_id(id, name, last_name, avatar, username, position)';
  const selectStr = `id, created_at, content, author_id, image_url, tags, title:titulo, is_pinned, pinned_at, show_link_preview, link_preview_url, likes_count, comments_count, up_votes_count, down_votes_count, reposts_count, ${authorSelect}`;
  
  console.log('Testing news query with author join...');
  const { data, error } = await supabase
    .from('news')
    .select(selectStr)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success! Fetched', data.length, 'items');
    if (data.length > 0) {
      console.log('First item author:', data[0].author);
    }
  }
}

testQuery();
