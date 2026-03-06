import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_posts_columns_test', {}); // Just fetch 1 post instead

    const { data: posts, error: postErr } = await supabase.from('posts').select('*').limit(1);
    console.log('Posts:', posts);
    console.log('Error:', postErr);
}

checkSchema();
