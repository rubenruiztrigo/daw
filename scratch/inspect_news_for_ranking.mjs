import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const monday = '2026-05-18T00:00:00.000Z';
  const sunday = '2026-05-24T23:59:59.999Z';

  console.log('Querying news for week May 18 to May 24...');
  const { data: weekNews, error: newsErr } = await supabase
    .from('news')
    .select('id, author_id, up_votes_count, created_at, titulo, author:profiles(name, last_name, username)')
    .gte('created_at', monday)
    .lte('created_at', sunday)
    .order('up_votes_count', { ascending: false });

  if (newsErr) {
    console.error('Error fetching news:', newsErr);
    return;
  }

  console.log('Found news items:', weekNews.length);
  weekNews.forEach(n => {
    console.log(`- "${n.titulo}" by ${n.author?.name} ${n.author?.last_name} (${n.author_id}): ${n.up_votes_count} votes, created at ${n.created_at}`);
  });
}

run();
