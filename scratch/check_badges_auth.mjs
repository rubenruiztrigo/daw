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

  console.log('Logged in successfully!');

  const { data: badges, error: badgesError } = await supabase.from('badges').select('*');
  console.log('Badges count:', badges?.length);
  console.log('Badges error:', badgesError);

  const { data: ranking, error: rankingError } = await supabase.from('ranking_history').select('*');
  console.log('Ranking history count:', ranking?.length);
  console.log('Ranking error:', rankingError);
}

run();
