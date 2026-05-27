import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BADGES = [
  { id: 'ranking_top1', label: 'TOP 1 del Ranking Semanal', nova_reward: 10 },
  { id: 'ranking_top2', label: 'TOP 2 del Ranking Semanal', nova_reward: 7 },
  { id: 'ranking_top3', label: 'TOP 3 del Ranking Semanal', nova_reward: 5 },
];

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Calculate Monday 00:00:00 → Sunday 23:59:59 of the current week (UTC)
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysSinceMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  // Fetch all news from this week with upvotes and author
  const { data: weekNews, error: newsErr } = await supabase
    .from('news')
    .select('author_id, up_votes_count')
    .gte('created_at', monday.toISOString())
    .lte('created_at', sunday.toISOString())
    .gt('up_votes_count', 0);

  if (newsErr) {
    return new Response(JSON.stringify({ error: newsErr.message }), { status: 500 });
  }

  if (!weekNews || weekNews.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: 'No news with upvotes this week' }));
  }

  // Aggregate: for each author take their best (max) upvoted news score
  const scoreByAuthor = new Map<string, number>();
  for (const row of weekNews) {
    const prev = scoreByAuthor.get(row.author_id) ?? 0;
    scoreByAuthor.set(row.author_id, Math.max(prev, row.up_votes_count ?? 0));
  }

  // Sort by score desc, take top 3 unique authors
  const top3 = [...scoreByAuthor.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([author_id, score]) => ({ author_id, score }));

  const results: any[] = [];

  for (let i = 0; i < top3.length; i++) {
    const { author_id, score } = top3[i];
    const badge = BADGES[i];

    // Insert into ranking_history (weekly record)
    await supabase.from('ranking_history').insert({
      user_id: author_id,
      badge_id: badge.id,
      created_at: new Date().toISOString(),
    });

    // Upsert the badge on the profile
    await supabase.from('user_badges').upsert(
      { user_id: author_id, badge_id: badge.id },
      { onConflict: 'user_id,badge_id' },
    );

    // Add novas
    const { error: rpcErr } = await supabase.rpc('add_novas', {
      target_user_id: author_id,
      delta: badge.nova_reward,
    });
    if (rpcErr) {
      const { data: p } = await supabase
        .from('profiles')
        .select('novas')
        .eq('id', author_id)
        .single();
      await supabase
        .from('profiles')
        .update({ novas: (p?.novas ?? 0) + badge.nova_reward })
        .eq('id', author_id);
    }

    // Notification
    await supabase.from('notifications').insert({
      user_id: author_id,
      sender_id: author_id,
      type: 'system',
      content: `¡Has quedado ${badge.label} esta semana con ${score} votos! Has ganado ${badge.nova_reward} novas como recompensa.`,
      is_read: false,
    });

    results.push({ author_id, badge: badge.id, score, novasAwarded: badge.nova_reward });
  }

  return new Response(JSON.stringify({ ok: true, week: { from: monday.toISOString(), to: sunday.toISOString() }, processed: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
