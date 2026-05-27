import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, last_name, avatar, position')
    .eq('id', 'fefd0f25-d1ad-408c-a749-59eb0d554641')
    .single();

  console.log('Profile:', data);
  console.log('Error:', error);
}

run();
