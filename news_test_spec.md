# 📋 News System — Especificación de Tests (SDD)

> **Proyecto**: RedSocialNovaGob  
> **Fecha**: 2026-03-19  
> **Autor**: QA Senior Agent  
> **Método**: Spec-Driven Development (SDD)  
> **Fuente de datos**: Auditoría en vivo via Supabase MCP (`lobfoivjtkmewqhunnry`)

---

## 1. Inventario del Sistema Auditado

### 1.1 Tablas principales (5)

| Tabla | RLS | Filas | PK | Rol |
|---|---|---|---|---|
| `news` | ✅ | 24 | `id` (uuid) | Contenido de noticias |
| `news_comments` | ✅ | 13 | `id` (uuid) | Comentarios en noticias |
| `news_votes` | ✅ | 22 | `(user_id, news_id)` compuesta | Votos up/down |
| `news_deleted` | ✅ | 3 | `id` (uuid) | Archivo de noticias eliminadas |
| `ranking_history` | ✅ | 7 | `id` (uuid) | Histórico de rankings semanales |

### 1.2 Triggers activos (5)

| Trigger | Tabla | Evento | Función |
|---|---|---|---|
| `tr_news_votes_count` | `news_votes` | INSERT/UPDATE/DELETE | `fn_update_news_likes_count()` |
| `tr_news_comments_count` | `news_comments` | INSERT/DELETE | `handle_news_comment_count()` |
| `tr_news_comments_update` | `news_comments` | INSERT/DELETE | `handle_news_comments_count()` |
| `tr_check_news_comment_likes_milestones` | `news_comments` | UPDATE | `fn_check_comment_likes_milestones()` |
| `tr_reposts_count` | `reposts` | INSERT/DELETE | `fn_update_reposts_count()` |

### 1.3 Funciones críticas (14)

| Función | Rol | Descripción |
|---|---|---|
| `fn_update_news_likes_count()` | Trigger activo | Sync `likes_count` según vote_type up/down. **No actualiza `up_votes_count`** |
| `handle_news_comment_count()` | Trigger activo | +1/-1 en `news.comments_count` |
| `handle_news_comments_count()` | Trigger activo | Recalcula `comments_count` con COUNT(*) |
| `fn_check_comment_likes_milestones()` | Trigger activo | Milestone: +2 novas a 20 likes en comentario |
| `fn_update_reposts_count()` | Trigger activo | Sync reposts para posts y news |
| `fn_process_weekly_ranking()` | pg_cron (lunes 00:00) | **🔴 BUG: usa `SUM(upvotes)` pero la columna se llama `up_votes_count`** |
| `fn_award_milestone_reward()` | RPC | Protección anti-duplicados + notificación |
| `fn_delete_post_secure()` | RPC | Archiva news en `news_deleted` y elimina original |
| `handle_news_vote()` | Legado (no trigger) | Sync `likes_count` + `down_votes_count` |
| `sync_news_votes_v4()` | Legado (no trigger) | Sync completo: `likes_count` + `up_votes_count` + `down_votes_count` |
| `handle_news_vote_counters_v2()` | Legado (no trigger) | Solo `likes_count` con delta |
| `handle_news_vote_sync()` | Legado (no trigger) | Recalcula `likes_count` con COUNT(*) |
| `handle_news_interactions()` | Legado (no trigger) | Recalcula todos los contadores |

### 1.4 Políticas RLS (12)

| Tabla | Política | Operación | Restricción |
|---|---|---|---|
| `news` | `news_insert` | INSERT | `author_id = auth.uid()` |
| `news` | `news_read` | SELECT | `true` (authenticated) |
| `news` | `Users can update their own news` | UPDATE | `auth.uid() = author_id` |
| `news` | `news_delete_self` | DELETE | `author_id = auth.uid()` |
| `news_comments` | `news_comments_insert` | INSERT | `author_id = auth.uid()` |
| `news_comments` | `news_comments_read` | SELECT | `true` (authenticated) |
| `news_votes` | `votes_manage` | INSERT | `user_id = auth.uid()` |
| `news_votes` | `votes_manage_update` | UPDATE | `user_id = auth.uid()` |
| `news_votes` | `votes_manage_delete` | DELETE | `user_id = auth.uid()` |
| `news_votes` | `Enable read access` | SELECT | `true` (public) |
| `news_deleted` | `Anyone can insert deleted news` | INSERT | ⚠️ `true` (public — sin auth!) |
| `news_deleted` | `Admins can view` | SELECT | `profiles.is_admin = true` |

### 1.5 pg_cron

| Job ID | Schedule | Comando | Activo |
|---|---|---|---|
| 1 | `0 0 * * 1` (lunes 00:00 UTC) | `SELECT fn_process_weekly_ranking();` | ✅ |

### 1.6 Constraints

| Constraint | Tabla | Tipo | Definición |
|---|---|---|---|
| `news_pkey` | `news` | PK | `PRIMARY KEY (id)` |
| `news_author_id_fkey` | `news` | FK | `→ profiles(id) ON DELETE CASCADE` |
| `news_votes_pkey` | `news_votes` | PK | `PRIMARY KEY (user_id, news_id)` — **previene voto doble** |
| `news_votes_vote_type_check` | `news_votes` | CHECK | `vote_type IN ('up', 'down')` |
| `news_votes_news_id_fkey` | `news_votes` | FK | `→ news(id) ON DELETE CASCADE` |
| `news_votes_user_id_fkey` | `news_votes` | FK | `→ profiles(id) ON DELETE CASCADE` |
| `news_comments_pkey` | `news_comments` | PK | `PRIMARY KEY (id)` |
| `news_comments_news_id_fkey` | `news_comments` | FK | `→ news(id) ON DELETE CASCADE` |
| `news_comments_author_id_fkey` | `news_comments` | FK | `→ profiles(id) ON DELETE CASCADE` |

---

## 2. Especificaciones de Test por Dominio

### 2.1 🟢 TC-NEWS — Publicación de Noticias

#### TC-NEWS-001: Publicación con texto y título
- **Precondición**: Usuario autenticado con `status = 'active'`
- **Acción**: INSERT con `titulo`, `content`, `author_id = auth.uid()`
- **Resultado esperado**:
  - Defaults: `likes_count=0`, `comments_count=0`, `up_votes_count=0`, `down_votes_count=0`, `reposts_count=0`, `is_pinned=false`
- **Verificación MCP**: `SELECT * FROM news WHERE id = <new_id>`

#### TC-NEWS-002: Publicación con imágenes (array)
- **Acción**: INSERT con `image_url = ARRAY['url1.jpg', 'url2.jpg']`
- **Resultado esperado**: `image_url` almacena array correctamente

#### TC-NEWS-003: Publicación con tags
- **Acción**: INSERT con `tags = ARRAY['innovación', 'ODS']`
- **Resultado esperado**: Array almacenado, default `'{}'::text[]`

#### TC-NEWS-004: FK — author_id debe existir en profiles
- **Acción**: INSERT con `author_id` inexistente
- **Resultado esperado**: Error FK `news_author_id_fkey`

#### TC-NEWS-005: RLS completa (CRUD)
- **Verificación**: Las 4 operaciones cubiertas por RLS
- **Resultado esperado**: INSERT, SELECT, UPDATE, DELETE — todos con policies ✅

#### TC-NEWS-006: Noticia sin título (campo nullable)
- **Acción**: INSERT con `titulo = NULL`
- **Resultado esperado**: Permitido (campo nullable)
- **Hallazgo**: 5 noticias en producción tienen `titulo = NULL`

---

### 2.2 🔵 TC-VOTE — Sistema de Votación y Contadores

#### TC-VOTE-001: Voto arriba (up)
- **Acción**: INSERT en `news_votes` con `vote_type = 'up'`
- **Resultado esperado**:
  - Trigger `fn_update_news_likes_count()` incrementa `news.likes_count += 1`
  - **⚠️ `up_votes_count` NO se actualiza** (el trigger activo no lo gestiona)
- **Verificación MCP**: `SELECT likes_count, up_votes_count FROM news WHERE id = <nid>`

#### TC-VOTE-002: Voto abajo (down)
- **Acción**: INSERT con `vote_type = 'down'`
- **Resultado esperado**: `likes_count` no cambia (trigger solo actúa en 'up')

#### TC-VOTE-003: Prevención de voto duplicado (PK compuesta)
- **Acción**: INSERT duplicado `(user_id, news_id)`
- **Resultado esperado**: Error `unique_violation` (PK compuesta)

#### TC-VOTE-004: Cambio de voto up → down (UPDATE)
- **Acción**: UPDATE `vote_type` de 'up' a 'down'
- **Resultado esperado**: `likes_count -= 1` (trigger detecta cambio)

#### TC-VOTE-005: Cambio de voto down → up (UPDATE)
- **Acción**: UPDATE `vote_type` de 'down' a 'up'
- **Resultado esperado**: `likes_count += 1`

#### TC-VOTE-006: Quitar voto (DELETE)
- **Acción**: DELETE del voto 'up'
- **Resultado esperado**: `likes_count -= 1`

#### TC-VOTE-007: CHECK constraint — solo 'up' o 'down'
- **Acción**: INSERT con `vote_type = 'neutral'`
- **Resultado esperado**: Error CHECK `news_votes_vote_type_check`

#### TC-VOTE-008: Coherencia `up_votes_count` vs realidad
- **Verificación directa**: Comparar `up_votes_count` con `COUNT(*) FROM news_votes WHERE vote_type = 'up'`
- **Resultado esperado**: ⚠️ **Desincronización conocida** — 23/24 noticias con `up_votes_count = 0` pese a tener votos reales

#### TC-VOTE-009: RLS — Solo puedes gestionar tus propios votos
- **Verificación**: Policies INSERT/UPDATE/DELETE restringidas a `user_id = auth.uid()`

---

### 2.3 🟠 TC-NCOMMENT — Hilos de Discusión en Noticias

#### TC-NCOMMENT-001: Comentar en una noticia
- **Acción**: INSERT en `news_comments` con `news_id`, `author_id = auth.uid()`, `text`
- **Resultado esperado**:
  - `likes = 0` por defecto
  - Trigger `tr_news_comments_count` → `handle_news_comment_count()` → `news.comments_count += 1`
  - Trigger `tr_news_comments_update` → `handle_news_comments_count()` → recalcula con COUNT(*)
- **Verificación MCP**: `SELECT comments_count FROM news WHERE id = <nid>`

#### TC-NCOMMENT-002: Eliminar comentario
- **Acción**: DELETE del comentario (nota: **no existe policy DELETE** en `news_comments`)
- **Resultado esperado**: ⚠️ **Bloqueado por falta de RLS DELETE policy**

#### TC-NCOMMENT-003: Like en comentario de noticia
- **Acción**: INSERT en `comment_likes` con `comment_id = <uuid_news_comment>`
- **Resultado esperado**:
  - `fn_sync_comment_likes()` detecta UUID y actualiza `news_comments.likes += 1`
  - **Ahora protegido contra duplicados por UNIQUE index** (fix previo)

#### TC-NCOMMENT-004: Milestone 20 likes en comentario de noticia
- **Precondición**: `news_comments.likes = 19`
- **Acción**: Like #20
- **Resultado esperado**: Trigger `tr_check_news_comment_likes_milestones` → `fn_check_comment_likes_milestones()` → +2 novas

#### TC-NCOMMENT-005: Coherencia de contadores de comentarios
- **Verificación directa**: Comparar `news.comments_count` con COUNT(*) real
- **Resultado esperado**: Validar 24 noticias

#### TC-NCOMMENT-006: Ausencia de DELETE/UPDATE RLS en news_comments
- **Verificación**: Listar policies de `news_comments`
- **Resultado esperado**: Solo INSERT y SELECT — **sin DELETE ni UPDATE**

---

### 2.4 🟣 TC-NAV — Vistas de Navegación

#### TC-NAV-001: "Última hora" (cronológico)
- **Query**: `SELECT * FROM news ORDER BY created_at DESC`
- **Resultado esperado**: Orden descendente por `created_at`

#### TC-NAV-002: "Más relevantes" (algoritmo de votos)
- **Query**: `SELECT * FROM news ORDER BY likes_count DESC, created_at DESC`
- **Resultado esperado**: Prioriza noticias con más upvotes, desempata por fecha

#### TC-NAV-003: "Top Ranking" (ranking semanal)
- **Query**: Basado en `ranking_history` + `profiles`
- **Resultado esperado**: TOP 3 de la semana anterior visible con `badge_id` = `ranking_top1/2/3`

#### TC-NAV-004: Verificar que el filtro cronológico devuelve todas las noticias
- **Verificación directa**: `SELECT count(*) FROM news` vs resultado paginado

---

### 2.5 🔴 TC-RANKING — Automatización de Novas (pg_cron)

#### TC-RANKING-001: pg_cron está activo y configurado
- **Verificación**: `SELECT * FROM cron.job WHERE jobid = 1`
- **Resultado esperado**: `schedule = '0 0 * * 1'`, `command = 'SELECT fn_process_weekly_ranking()'`, `active = true`

#### TC-RANKING-002: 🔴 BUG CRÍTICO — `fn_process_weekly_ranking` usa columna inexistente
- **Hallazgo**: La función referencia `SUM(upvotes)` pero la columna real es `up_votes_count`
- **Impacto**: La función se ejecuta sin error pero `SUM(NULL)` para todos los autores → nadie recibe premio
- **Verificación MCP**: `SELECT column_name FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'upvotes'` → vacío

#### TC-RANKING-003: 🔴 BUG DERIVADO — `up_votes_count` siempre es 0
- **Hallazgo**: El trigger activo (`fn_update_news_likes_count`) solo actualiza `likes_count`, nunca `up_votes_count`
- **Impacto**: Incluso si se corrige TC-RANKING-002 cambiando a `SUM(up_votes_count)`, el resultado seguiría siendo 0
- **Solución necesaria**: El ranking debe usar `likes_count` (que sí se mantiene sincronizado) o sincronizar `up_votes_count`

#### TC-RANKING-004: Guard anti-duplicados
- **Verificación**: La función verifica `EXISTS ranking_history WHERE created_at >= v_start_date`
- **Resultado esperado**: Si ya existe ranking para esa semana, retorna sin hacer nada

#### TC-RANKING-005: Novas otorgados correctamente
- **Datos esperados**: TOP 1 = +10 novas, TOP 2 = +7 novas, TOP 3 = +5 novas
- **Verificación MCP**: `SELECT * FROM ranking_history ORDER BY created_at DESC`

#### TC-RANKING-006: Histórico de ejecuciones
- **Datos reales**: 3 ejecuciones históricas (2026-02-25, 2026-03-03, 2026-03-11)
- **Verificación**: 7 entradas con badge_ids correctos

#### TC-RANKING-007: Tie-breaking (desempate)
- **Verificación**: La función usa `MIN(created_at) ASC` como desempate
- **Resultado esperado**: En empate de votos, gana quien publicó primero

#### TC-RANKING-008: Notificación automática al ganar ranking
- **Verificación**: INSERT en `notifications` con `type = 'system'` y contenido del ranking

---

## 3. Hallazgos Críticos de la Auditoría

> [!CAUTION]
> ### 3.1 🔴 `fn_process_weekly_ranking` usa columna `upvotes` inexistente
> La función ejecuta `SUM(upvotes)` pero la tabla `news` no tiene columna `upvotes`.
> Las columnas reales son: `likes_count`, `up_votes_count`, `down_votes_count`.
> **El ranking semanal NO funciona correctamente** — `SUM(NULL)` = NULL para todos.

> [!CAUTION]
> ### 3.2 🔴 `up_votes_count` nunca se sincroniza
> El trigger activo `fn_update_news_likes_count` solo actualiza `likes_count`.
> `up_votes_count` permanece en 0 para 23 de 24 noticias (la única excepción probablemente fue un test manual).
> **El ranking debe basarse en `likes_count`** que sí refleja los votos reales.

> [!WARNING]
> ### 3.3 RLS `news_deleted` sobreexpuesta
> La policy `Anyone can insert deleted news` tiene `with_check = true` para rol `public`.
> Mismo problema que se encontró y corrigió en `posts_deleted`.

> [!WARNING]
> ### 3.4 `news_comments` sin DELETE/UPDATE RLS
> Solo existen policies INSERT y SELECT.
> Los autores no pueden eliminar ni editar sus comentarios en noticias.

> [!NOTE]
> ### 3.5 Funciones legado sin trigger asociado
> Existen 6 funciones de votación (`handle_news_vote`, `sync_news_votes_v4`, `handle_news_vote_counters_v2`, etc.) sin trigger activo. Solo `fn_update_news_likes_count` está conectada. Las demás son vestigios de iteraciones anteriores.

---

## 4. Plan de Ejecución de Tests (5 Fases)

### Fase 1: Integridad básica y constraints
1. Validar FKs (author_id, news_id) con INSERTs inválidos
2. Validar CHECK constraint `vote_type`
3. Validar PK compuesta en `news_votes` (anti-duplicados)
4. Validar CASCADE behavior

### Fase 2: Publicación de noticias
1. Verificar defaults y estructura
2. Arrays de imágenes y tags
3. RLS enforcement

### Fase 3: Sistema de votación
1. Ciclo completo up/down/change/delete
2. Coherencia `likes_count` vs COUNT(*) real
3. **Detectar desincronización de `up_votes_count`**

### Fase 4: Comentarios y discusión
1. Comentar → verificar contador
2. Likes en comentarios de noticias
3. **Detectar falta de DELETE/UPDATE RLS**

### Fase 5: Ranking semanal y pg_cron
1. Verificar configuración pg_cron
2. **Simular ejecución de `fn_process_weekly_ranking` con EXPLAIN**
3. Verificar guard anti-duplicados
4. Validar histórico de rankings

---

## 5. Fixes Críticos Propuestos

### Fix A: Corregir `fn_process_weekly_ranking` (PRIORIDAD MÁXIMA)
```sql
-- Cambiar SUM(upvotes) → SUM(likes_count) que sí se sincroniza
-- O alternativamente: contar votos reales directamente
```

### Fix B: Sincronizar `up_votes_count` o eliminarlo
```sql
-- Opción 1: Actualizar trigger para también sincronizar up_votes_count
-- Opción 2: Eliminar up_votes_count y usar solo likes_count
```

### Fix C: Restringir `news_deleted` INSERT RLS
```sql
DROP POLICY IF EXISTS "Anyone can insert deleted news" ON public.news_deleted;
```

### Fix D: Añadir DELETE/UPDATE RLS en `news_comments`
```sql
CREATE POLICY "news_comments_delete_self" ON public.news_comments
    FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "news_comments_update_self" ON public.news_comments
    FOR UPDATE TO authenticated USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());
```
