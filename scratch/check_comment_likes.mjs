import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCommentLikes() {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('*');

  if (error) {
    console.error('Error fetching comment_likes:', error);
    return;
  }

  console.log(`Fetched ${data.length} likes.`);
  if (data.length > 0) {
      console.log('Columns in comment_likes:', Object.keys(data[0]));
  }

  const seen = new Set();
  const duplicates = [];
  for (const like of data) {
      const key = `${like.user_id}-${like.comment_id}-${like.reply_id}`;
      if (seen.has(key)) {
          duplicates.push(like);
      } else {
          seen.add(key);
      }
  }

  if (duplicates.length > 0) {
    console.log('Found duplicates in comment_likes:', duplicates);
  } else {
    console.log('No duplicates found in comment_likes.');
  }

  // Also check schema if possible (using RPC or just trying to insert)
  const { error: insertError } = await supabase.rpc('fn_check_schema_info', { table_name: 'comment_likes' });
  if (insertError) {
      // If RPC doesn't exist, try to get column names
      const { data: cols, error: colError } = await supabase.from('comment_likes').select('*').limit(1);
      if (!colError && cols && cols.length > 0) {
          console.log('Columns in comment_likes:', Object.keys(cols[0]));
      }
  }
}

checkCommentLikes();
