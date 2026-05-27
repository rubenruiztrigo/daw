const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fyzeibgevjvtknhfiywy.supabase.co', 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq');
async function run() {
  const p = '1cbf5971-d76e-421d-8301-6a8a6f8e7cb6';
  const u = '17ee1593-22a4-45a2-a7ed-d321c5b8cb6b';
  supabase.channel('test').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${p}` }, (payload) => {
    console.log('REALTIME PAYLOAD:', payload.new.likes_count, payload.new.reposts_count);
  }).subscribe();
  await new Promise(r => setTimeout(r, 2000));
  console.log('Inserting...');
  await supabase.from('post_likes').delete().eq('post_id', p).eq('user_id', u);
  await new Promise(r => setTimeout(r, 1000));
  await supabase.from('post_likes').insert({ post_id: p, user_id: u, vote_type: 'up' });
  await new Promise(r => setTimeout(r, 2000));
  process.exit(0);
}
run();
