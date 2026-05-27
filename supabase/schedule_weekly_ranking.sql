-- ============================================================
-- RANKING SEMANAL — ejecutar UNA VEZ en Supabase SQL Editor
-- ============================================================

-- 1. Función que procesa el ranking y otorga insignias
create or replace function process_weekly_ranking()
returns void
language plpgsql
security definer
as $$
declare
  v_monday     timestamptz;
  v_sunday     timestamptz;
  v_author_id  uuid;
  v_score      int;
  v_badge_id   text;
  v_nova_reward int;
  v_label      text;
  v_rank       int := 1;
  rec          record;
begin
  -- Rango: lunes 00:00 → domingo 23:59:59 de la semana actual (UTC)
  v_monday := date_trunc('week', now() at time zone 'UTC') at time zone 'UTC';
  v_sunday := v_monday + interval '6 days 23 hours 59 minutes 59 seconds';

  -- Top 3 autores únicos por su mejor noticia de la semana
  for rec in
    select author_id, max(up_votes_count) as best_score
    from news
    where created_at >= v_monday
      and created_at <= v_sunday
      and up_votes_count > 0
    group by author_id
    order by best_score desc
    limit 3
  loop
    v_author_id := rec.author_id;
    v_score     := rec.best_score;

    -- Determinar insignia y novas según posición
    case v_rank
      when 1 then v_badge_id := 'ranking_top1'; v_nova_reward := 10; v_label := 'TOP 1 del Ranking Semanal';
      when 2 then v_badge_id := 'ranking_top2'; v_nova_reward := 7;  v_label := 'TOP 2 del Ranking Semanal';
      when 3 then v_badge_id := 'ranking_top3'; v_nova_reward := 5;  v_label := 'TOP 3 del Ranking Semanal';
    end case;

    -- Guardar en historial de ranking
    insert into ranking_history (user_id, badge_id, created_at)
    values (v_author_id, v_badge_id, now());

    -- Asignar insignia al perfil (si no la tiene ya) de forma segura
    IF NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = v_author_id AND badge_id = v_badge_id
    ) THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (v_author_id, v_badge_id);
    END IF;

    -- Sumar novas (nunca por debajo de 0)
    update profiles
    set novas = greatest(0, coalesce(novas, 0) + v_nova_reward)
    where id = v_author_id;

    -- Enviar notificación
    insert into notifications (user_id, sender_id, type, content, is_read)
    values (
      v_author_id,
      v_author_id,
      'system',
      '¡Has quedado ' || v_label || ' esta semana con ' || v_score || ' votos! Has ganado ' || v_nova_reward || ' novas como recompensa.',
      false
    );

    v_rank := v_rank + 1;
  end loop;
end;
$$;

-- 2. Programar la función todos los domingos a las 23:59 UTC
select cron.schedule(
  'process-weekly-ranking',
  '59 23 * * 0',
  'select process_weekly_ranking()'
);
