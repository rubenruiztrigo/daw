import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co/';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing login for el11@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'el11@gmail.com',
    password: '123456'
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful! User ID:', data.user.id);
  }
}

run();
