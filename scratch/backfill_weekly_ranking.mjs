import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BADGES = [
  { id: 'ranking_top1', label: 'TOP 1 del Ranking Semanal', nova_reward: 10 },
  { id: 'ranking_top2', label: 'TOP 2 del Ranking Semanal', nova_reward: 7 },
  { id: 'ranking_top3', label: 'TOP 3 del Ranking Semanal', nova_reward: 5 },
];

async function run() {
  // Last week dates: 2026-05-11 00:00:00 UTC to 2026-05-17 23:59:59 UTC
  const monday = '2026-05-11T00:00:00.000Z';
  const sunday = '2026-05-17T23:59:59.999Z';

  console.log('Querying news for last week (', monday, 'to', sunday, ')...');
  
  const { data: weekNews, error: newsErr } = await supabase
    .from('news')
    .select('id, author_id, up_votes_count, created_at, titulo')
    .gte('created_at', monday)
    .lte('created_at', sunday)
    .gt('up_votes_count', 0);

  if (newsErr) {
    console.error('Error fetching news:', newsErr);
    return;
  }

  console.log('Found news items:', weekNews);

  if (!weekNews || weekNews.length === 0) {
    console.log('No news with upvotes last week.');
    return;
  }

  // Aggregate: for each author take their best (max) upvoted news score
  const scoreByAuthor = new Map();
  for (const row of weekNews) {
    const prev = scoreByAuthor.get(row.author_id) ?? 0;
    scoreByAuthor.set(row.author_id, Math.max(prev, row.up_votes_count ?? 0));
  }

  // Sort by score desc, take top 3 unique authors
  const top3 = [...scoreByAuthor.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([author_id, score]) => ({ author_id, score }));

  console.log('Top 3 winners last week:', top3);

  // Backfill:
  const backfillDate = '2026-05-17T23:59:00.000Z'; // Recorded as last week Sunday night

  for (let i = 0; i < top3.length; i++) {
    const { author_id, score } = top3[i];
    const badge = BADGES[i];

    console.log(`Processing Rank ${i + 1}: Author ${author_id} with score ${score}`);

    // 1. Insert into ranking_history
    const { error: histErr } = await supabase.from('ranking_history').insert({
      user_id: author_id,
      badge_id: badge.id,
      created_at: backfillDate,
    });
    if (histErr) {
      console.error('Error inserting ranking history:', histErr);
    } else {
      console.log('Inserted into ranking_history');
    }

    // 2. Upsert user_badges
    const { error: badgeErr } = await supabase.from('user_badges').upsert(
      { user_id: author_id, badge_id: badge.id },
      { onConflict: 'user_id,badge_id' }
    );
    if (badgeErr) {
      console.error('Error upserting user badge:', badgeErr);
    } else {
      console.log('Upserted user_badges');
    }

    // 3. Add novas
    const { data: p, error: getErr } = await supabase
      .from('profiles')
      .select('novas')
      .eq('id', author_id)
      .single();
    
    if (getErr) {
      console.error('Error getting profile novas:', getErr);
    } else {
      const currentNovas = p?.novas ?? 0;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ novas: currentNovas + badge.nova_reward })
        .eq('id', author_id);
      
      if (updateErr) {
        console.error('Error updating profile novas:', updateErr);
      } else {
        console.log(`Added ${badge.nova_reward} novas (New total: ${currentNovas + badge.nova_reward})`);
      }
    }

    // 4. Send notification
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: author_id,
      sender_id: author_id, // sent by self/system
      type: 'system',
      content: `¡Has quedado ${badge.label} la semana del 11 al 17 de mayo con ${score} votos! Has ganado ${badge.nova_reward} novas como recompensa.`,
      is_read: false,
    });
    if (notifErr) {
      console.error('Error sending notification:', notifErr);
    } else {
      console.log('Sent notification');
    }
  }

  console.log('Backfill finished.');
}

run();
