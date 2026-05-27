import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('--- Checking ranking_history ---');
  const { data: rankingHist, error: rankingError } = await supabase
    .from('ranking_history')
    .select('*')
    .order('created_at', { ascending: false });
  console.log('ranking_history count:', rankingHist?.length);
  console.log('ranking_history entries:', rankingHist);

  console.log('\n--- Checking notifications containing "TOP" or "novas" ---');
  const { data: notifications, error: notError } = await supabase
    .from('notifications')
    .select('*')
    .ilike('content', '%Ranking Semanal%')
    .order('created_at', { ascending: false });
  console.log('Notifications count:', notifications?.length);
  console.log('Notifications:', notifications);

  console.log('\n--- Checking user_badges for TOP ranking ---');
  const { data: userBadges, error: badgeError } = await supabase
    .from('user_badges')
    .select('*, profiles:user_id(name, last_name, username)')
    .in('badge_id', ['ranking_top1', 'ranking_top2', 'ranking_top3']);
  console.log('User badges count:', userBadges?.length);
  console.log('User badges:', userBadges);
}

run();
