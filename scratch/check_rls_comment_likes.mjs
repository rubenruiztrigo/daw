import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRLS() {
  const { data, error } = await supabase.rpc('fn_check_rls', { table_name: 'comment_likes' });
  if (error) {
    // If RPC doesn't exist, try to insert and see the error
    console.log('RPC fn_check_rls not found, trying manual insert test...');
    const { error: insertError } = await supabase.from('comment_likes').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        comment_id: '00000000-0000-0000-0000-000000000000'
    });
    console.log('Insert error:', insertError);
  } else {
    console.log('RLS Status:', data);
  }
}

checkRLS();
