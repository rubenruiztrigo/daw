import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('--- Testing query from RankingHistoryModal ---');
  const { data, error } = await supabase
    .from('ranking_history')
    .select(`
        badge_id,
        created_at,
        user_id,
        user:profiles!user_id (
            id,
            name,
            last_name,
            avatar,
            position
        )
    `)
    .in('badge_id', ['ranking_top1', 'ranking_top2', 'ranking_top3'])
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
