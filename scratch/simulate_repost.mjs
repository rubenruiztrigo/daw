import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co/';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Logging in as Anouar...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'el11@gmail.com',
    password: '123456'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const postId = '98de8ba3-d4ce-4e4a-89e5-01bc136f9d32';
  const authorId = 'fefd0f25-d1ad-408c-a749-59eb0d554641'; // Ruben

  console.log('Checking if already reposted...');
  const { data: existing } = await supabase
    .from('reposts')
    .select('id')
    .eq('user_id', authData.user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    console.log('Already reposted, deleting existing first...');
    await supabase.from('reposts').delete().eq('id', existing.id);
    await supabase.from('notifications').delete().eq('sender_id', authData.user.id).eq('post_id', postId).eq('type', 'repost');
  }

  console.log('Inserting repost...');
  const { error: repostError } = await supabase
    .from('reposts')
    .insert({
      post_id: postId,
      user_id: authData.user.id
    });

  if (repostError) {
    console.error('Repost insertion failed:', repostError.message);
    return;
  }
  console.log('Repost inserted successfully!');

  console.log('Inserting notification...');
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: authorId,
      sender_id: authData.user.id,
      type: 'repost',
      content: 'ha compartido tu publicación',
      post_id: postId,
      news_id: null
    });

  if (notifError) {
    console.error('Notification insertion failed:', notifError.message);
  } else {
    console.log('Notification inserted successfully!');
  }
}

run();
