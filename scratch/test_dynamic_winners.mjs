import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  
  // This week's Monday (UTC)
  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() - daysSinceMonday);
  thisMonday.setUTCHours(0, 0, 0, 0);
  
  // Last week's Monday (UTC)
  const lastMonday = new Date(thisMonday);
  lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);
  
  // Last week's Sunday (UTC)
  const lastSunday = new Date(lastMonday);
  lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
  lastSunday.setUTCHours(23, 59, 59, 999);

  console.log('Last week range:', lastMonday.toISOString(), 'to', lastSunday.toISOString());

  const { data: weekNews, error } = await supabase
    .from('news')
    .select('author_id, up_votes_count, profiles:author_id(id, name, last_name, avatar, position)')
    .gte('created_at', lastMonday.toISOString())
    .lte('created_at', lastSunday.toISOString())
    .gt('up_votes_count', 0);

  if (error) {
    console.error('Error fetching week news:', error);
    return;
  }

  console.log('Week news found:', weekNews);

  const scoreByAuthor = new Map();
  for (const row of weekNews) {
    if (!row.profiles) continue;
    const authorId = row.author_id;
    const currentScore = row.up_votes_count ?? 0;
    const existing = scoreByAuthor.get(authorId);
    if (!existing || currentScore > existing.score) {
      scoreByAuthor.set(authorId, {
        score: currentScore,
        user: {
          id: row.profiles.id,
          name: row.profiles.name,
          lastName: row.profiles.last_name,
          avatar: row.profiles.avatar,
          position: row.profiles.position
        }
      });
    }
  }

  const sorted = [...scoreByAuthor.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const rankBadges = ['ranking_top1', 'ranking_top2', 'ranking_top3'];
  const processedWinners = sorted.map((item, index) => ({
    user: item.user,
    badgeId: rankBadges[index],
    createdAt: lastSunday.toISOString()
  }));

  console.log('Processed dynamic winners:', processedWinners);
}

run();
