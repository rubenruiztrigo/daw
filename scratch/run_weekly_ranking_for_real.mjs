import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Starting weekly ranking processing for the week May 18 to May 24...');

  // Dates
  const monday = '2026-05-18T00:00:00.000Z';
  const sunday = '2026-05-24T23:59:59.999Z';
  const executionDate = '2026-05-24T23:59:00.000Z'; // Record it as Sunday late night

  // 1. Fetch news
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

  console.log('News items found:', weekNews);

  if (!weekNews || weekNews.length === 0) {
    console.log('No news with upvotes this week.');
    return;
  }

  // 2. Aggregate max score per author
  const scoreByAuthor = new Map();
  for (const row of weekNews) {
    const prev = scoreByAuthor.get(row.author_id) ?? 0;
    scoreByAuthor.set(row.author_id, Math.max(prev, row.up_votes_count ?? 0));
  }

  // Sort and take top 3
  const top3 = [...scoreByAuthor.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([author_id, score]) => ({ author_id, score }));

  console.log('Top 3 authors calculated:', top3);

  const BADGES = [
    { id: 'ranking_top1', label: 'TOP 1 del Ranking Semanal', nova_reward: 10 },
    { id: 'ranking_top2', label: 'TOP 2 del Ranking Semanal', nova_reward: 7 },
    { id: 'ranking_top3', label: 'TOP 3 del Ranking Semanal', nova_reward: 5 },
  ];

  for (let i = 0; i < top3.length; i++) {
    const { author_id, score } = top3[i];
    const badge = BADGES[i];

    console.log(`\n--- Processing Rank ${i + 1}: Author ${author_id} with score ${score} ---`);

    // A. Check if ranking history already exists for this week & user
    const { data: existingHist } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('user_id', author_id)
      .eq('badge_id', badge.id)
      .gte('created_at', monday)
      .lte('created_at', sunday);

    if (existingHist && existingHist.length > 0) {
      console.log(`Ranking history record already exists for ${author_id} (${badge.id})`);
      continue;
    }

    // B. Insert into ranking_history
    const { error: histErr } = await supabase.from('ranking_history').insert({
      user_id: author_id,
      badge_id: badge.id,
      created_at: executionDate,
    });
    if (histErr) {
      console.error('Error inserting ranking history:', histErr);
      continue;
    }
    console.log('Inserted into ranking_history');

    // C. Upsert user_badges
    const { error: badgeErr } = await supabase.from('user_badges').upsert(
      { user_id: author_id, badge_id: badge.id },
      { onConflict: 'user_id,badge_id' }
    );
    if (badgeErr) {
      console.error('Error upserting user badge:', badgeErr);
    } else {
      console.log(`Upserted user_badge ${badge.id}`);
    }

    // D. Fetch profile to award novas
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('novas')
      .eq('id', author_id)
      .single();

    if (profileErr) {
      console.error('Error fetching profile:', profileErr);
      continue;
    }

    const currentNovas = profile?.novas ?? 0;
    const newNovas = currentNovas + badge.nova_reward;

    // E. Update profiles
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ novas: newNovas })
      .eq('id', author_id);

    if (updateErr) {
      console.error('Error updating profile novas:', updateErr);
    } else {
      console.log(`Awarded ${badge.nova_reward} novas. New balance: ${newNovas}`);
      
      // F. Insert into novas_history
      const { error: historyErr } = await supabase.from('novas_history').insert({
        user_id: author_id,
        novas: badge.nova_reward,
        motivo: badge.label,
        created_at: executionDate,
      });
      if (historyErr) {
        console.error('Error inserting novas history:', historyErr);
      } else {
        console.log('Inserted record into novas_history');
      }
    }

    // G. Send notification
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: author_id,
      sender_id: author_id,
      type: 'system',
      content: `¡Has quedado ${badge.label} la semana del 18 al 24 de mayo con ${score} votos! Has ganado ${badge.nova_reward} novas como recompensa.`,
      is_read: false,
      created_at: executionDate,
    });
    if (notifErr) {
      console.error('Error sending notification:', notifErr);
    } else {
      console.log('Sent notification to user');
    }
  }

  console.log('\nWeekly ranking processing completed.');
}

run();
