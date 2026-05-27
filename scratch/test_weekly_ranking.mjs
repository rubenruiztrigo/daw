import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysSinceMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  console.log('Calculation range:');
  console.log('Monday:', monday.toISOString());
  console.log('Sunday:', sunday.toISOString());

  // Fetch all news from this week with upvotes and author
  const { data: weekNews, error: newsErr } = await supabase
    .from('news')
    .select('author_id, up_votes_count, created_at')
    .gte('created_at', monday.toISOString())
    .lte('created_at', sunday.toISOString())
    .gt('up_votes_count', 0);

  if (newsErr) {
    console.error('Error fetching news:', newsErr);
    return;
  }

  console.log('Found news items this week:', weekNews);
}

run();
