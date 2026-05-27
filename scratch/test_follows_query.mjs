import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Logging in as Ruben...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ruben.ruiz@gmail.com',
    password: '123456'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const userId = authData.session.user.id;
  console.log('Logged in successfully! User ID:', userId);

  console.log('Timing follows query...');
  const start = Date.now();
  const [{ data: following, error: followingErr }, { data: followers, error: followersErr }] = await Promise.all([
    supabase.from('follows').select('followed_id').eq('follower_id', userId),
    supabase.from('follows').select('follower_id').eq('followed_id', userId)
  ]);
  const end = Date.now();

  console.log(`Query completed in ${end - start}ms`);
  console.log('following error:', followingErr);
  console.log('followers error:', followersErr);
  console.log('following count:', following?.length);
  console.log('followers count:', followers?.length);
}

run();
