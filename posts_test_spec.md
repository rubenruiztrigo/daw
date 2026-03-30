# 📋 Posts System — Especificación de Tests (SDD)

> **Proyecto**: RedSocialNovaGob  
> **Fecha**: 2026-03-19  
> **Autor**: QA Senior Agent  
> **Método**: Spec-Driven Development (SDD) — Especificación primero, código después  
> **Fuente de datos**: Auditoría en vivo via Supabase MCP (`lobfoivjtkmewqhunnry`)

---

## 1. Inventario del Sistema Auditado

### 1.1 Tablas principales (10)

| Tabla | RLS | Filas | PK | Rol |
|---|---|---|---|---|
| `posts` | ✅ | 9 | `id` (uuid) | Contenido principal |
| `post_likes` | ✅ | 6 | `(user_id, post_id)` compuesta | Likes con prevención de duplicados |
| `post_comments` | ✅ | 12 | `id` (uuid) | Comentarios de nivel 1 |
| `comment_replies` | ✅ | 4 | `id` (uuid) | Respuestas anidadas (hilos) |
| `comment_likes` | ✅ | 3 | `id` (uuid) | Likes en comentarios y replies |
| `post_reposts` | ✅ | 0 | `(user_id, post_id)` compuesta | Reposts con prevención de duplicados |
| `reposts` | ✅ | 0 | `id` (uuid) | Reposts universales (posts + news) |
| `messages` | ✅ | 19 | `id` (uuid) | Compartir posts vía DM |
| `notifications` | ✅ | 88 | `id` (uuid) | Notificaciones generadas |
| `posts_deleted` | ✅ | 22 | `id` (uuid) | Archivo de posts eliminados |

### 1.2 Triggers catalogados (23)

| Trigger | Tabla | Evento | Función ejecutada |
|---|---|---|---|
| `on_comment_like_change` | `comment_likes` | INSERT/DELETE | `handle_comment_likes_count()` |
| `tr_check_comment_engagement_milestone` | `comment_likes` | INSERT | `check_comment_engagement_milestone()` |
| `tr_sync_comment_likes` | `comment_likes` | INSERT/DELETE | `fn_sync_comment_likes()` |
| `tr_check_comment_reply_likes_milestones` | `comment_replies` | UPDATE | `fn_check_comment_likes_milestones()` |
| `tr_replies_count_sync` | `comment_replies` | INSERT/DELETE | `handle_reply_count_sync()` |
| `on_comment_added` | `post_comments` | INSERT/DELETE | `handle_post_comment_count()` |
| `tr_check_post_comment_likes_milestones` | `post_comments` | UPDATE | `fn_check_comment_likes_milestones()` |
| `tr_post_comments_count` | `post_comments` | INSERT/DELETE | `handle_post_comment_count()` |
| `tr_post_comments_update` | `post_comments` | INSERT/DELETE | `handle_post_comments_count()` |
| `tr_post_likes_count` | `post_likes` | INSERT/UPDATE/DELETE | `fn_update_posts_likes_count()` |
| `tr_repost_sync_v2` | `post_reposts` | INSERT/DELETE | `handle_repost_counters_v2()` |
| `tr_check_post_likes_milestones` | `posts` | UPDATE | `fn_check_post_likes_milestones()` |
| `tr_reposts_count` | `reposts` | INSERT/DELETE | `fn_update_reposts_count()` |

### 1.3 Funciones críticas catalogadas (21)

| Función | Tipo | Descripción |
|---|---|---|
| `fn_update_posts_likes_count()` | Trigger | Sync `likes_count` en `posts` según `vote_type` (up/down) |
| `fn_sync_comment_likes()` | Trigger | Sync `likes` en `post_comments`, `news_comments` y `comment_replies` |
| `handle_post_comment_count()` | Trigger | +1/-1 en `posts.comments_count` |
| `handle_post_comments_count()` | Trigger | Recalcula `comments_count` con COUNT(*) real |
| `handle_repost_counters_v2()` | Trigger | +1/-1 en `posts.reposts_count` |
| `fn_update_reposts_count()` | Trigger | Sync reposts para tabla `reposts` (posts + news) |
| `fn_check_post_likes_milestones()` | Trigger | Milestone: +3 novas a 20 likes, +5 novas a 50 likes |
| `fn_check_comment_likes_milestones()` | Trigger | Milestone: +2 novas a 20 likes en comentario |
| `check_comment_engagement_milestone()` | Trigger | Milestone: +2 novas a 21 likes en comentario (legacy) |
| `fn_delete_post_secure()` | RPC | Archiva post en `posts_deleted` y elimina el original |
| `handle_repost_operations_v5()` | Trigger | Reposts + notificación automática al autor |

### 1.4 Políticas RLS catalogadas (28)

| Tabla | Política | Operación | Restricción |
|---|---|---|---|
| `posts` | `posts_insert` | INSERT | `author_id = auth.uid()` |
| `posts` | `posts_read` | SELECT | `true` (authenticated) |
| `posts` | `posts_delete_self` | DELETE | `author_id = auth.uid()` |
| `posts` | `Users can update their own posts` | UPDATE | `auth.uid() = author_id` |
| `post_likes` | `likes_manage_insert` | INSERT | `user_id = auth.uid()` |
| `post_likes` | `likes_manage_delete` | DELETE | `user_id = auth.uid()` |
| `post_likes` | `likes_read` | SELECT | `true` (authenticated) |
| `post_comments` | `comments_insert` | INSERT | `author_id = auth.uid()` |
| `post_comments` | `comments_read` | SELECT | `true` (authenticated) |
| `comment_replies` | `Authenticated users can reply` | INSERT | `auth.uid() IS NOT NULL` |
| `comment_replies` | `comment_replies_insert_policy` | INSERT | `author_id = auth.uid()` |
| `comment_replies` | `Public read replies` / `_select_policy` | SELECT | `true` |
| `comment_likes` | `Insertar likes propios` | INSERT | `user_id = auth.uid()` |
| `comment_likes` | `Borrar likes propios` | DELETE | `user_id = auth.uid()` |
| `comment_likes` | `Users can manage their own` | ALL | `auth.uid() = user_id` |
| `post_reposts` | `reposts_manage_insert` | INSERT | `user_id = auth.uid()` |
| `post_reposts` | `reposts_manage_delete` | DELETE | `user_id = auth.uid()` |
| `post_reposts` | `reposts_read` | SELECT | `true` (authenticated) |
| `reposts` | `Users can repost` | INSERT | `auth.uid() = user_id` |
| `reposts` | `Users can remove their repost` | DELETE | `auth.uid() = user_id` |
| `reposts` | `Public read reposts` | SELECT | `true` |
| `posts_deleted` | `posts_eliminados_insert` | INSERT | `user_id = auth.uid()` |
| `posts_deleted` | `Admins can view` | SELECT | `profiles.is_admin = true` |

---

## 2. Especificaciones de Test por Dominio

### 2.1 🟢 TC-POST — Creación de Contenido

#### TC-POST-001: Publicación con texto simple
- **Precondición**: Usuario autenticado con `status = 'active'`
- **Acción**: INSERT en `posts` con `content = 'Test de publicación'`, `author_id = auth.uid()`
- **Resultado esperado**:
  - Row insertada con `id` UUID válido
  - `likes_count = 0`, `comments_count = 0`, `reposts_count = 0`
  - `created_at` y `updated_at` fijados a UTC now
  - `is_pinned = false`
- **Verificación MCP**: `SELECT * FROM posts WHERE id = <new_id>`

#### TC-POST-002: Publicación con imágenes (array)
- **Acción**: INSERT con `image_url = ARRAY['https://storage.supabase.co/img1.jpg', 'https://storage.supabase.co/img2.jpg']`
- **Resultado esperado**:
  - `image_url` almacena array de 2 elementos
  - Cada URL es accesible
- **Verificación MCP**: Validar tipo de dato `_text` y longitud del array

#### TC-POST-003: Publicación con documento adjunto
- **Acción**: INSERT con `doc_url = 'https://storage.../doc.pdf'`, `doc_name = 'Informe Q1.pdf'`
- **Resultado esperado**: Ambos campos almacenados correctamente
- **Verificación MCP**: `SELECT doc_url, doc_name FROM posts WHERE id = <new_id>`

#### TC-POST-004: Publicación con tags
- **Acción**: INSERT con `tags = ARRAY['administración', 'transparencia']`
- **Resultado esperado**: Array de tags almacenado, predeterminado a `'{}'::text[]` si vacío
- **Verificación MCP**: Comparar con `'{}'::text[]` en caso null

#### TC-POST-005: Publicación con evento vinculado
- **Acción**: INSERT con `linked_event_id = <uuid_evento_existente>`
- **Resultado esperado**: FK `posts_linked_event_id_fkey` satisfecha
- **Verificación MCP**: `SELECT linked_event_id FROM posts WHERE id = <new_id>` es not null

#### TC-POST-006: Publicación con evento vinculado inválido (negativo)
- **Acción**: INSERT con `linked_event_id = <uuid_inexistente>`
- **Resultado esperado**: Error de FK violation
- **Verificación MCP**: Confirmar que la row NO se insertó

#### TC-POST-007: RLS — Solo el autor puede insertar su propio post
- **Acción**: INSERT con `author_id ≠ auth.uid()`
- **Resultado esperado**: Denied por RLS policy `posts_insert`
- **Verificación MCP**: Error 403 / row count = 0

---

### 2.2 🔵 TC-LIKE — Interacciones Sociales: Likes

#### TC-LIKE-001: Dar like (vote_type = 'up')
- **Precondición**: Post existente, usuario autenticado
- **Acción**: INSERT en `post_likes` con `user_id = auth.uid()`, `post_id`, `vote_type = 'up'`
- **Resultado esperado**:
  - Row insertada en `post_likes`
  - Trigger `tr_post_likes_count` ejecuta `fn_update_posts_likes_count()`
  - `posts.likes_count` incrementa en +1
- **Verificación MCP**:
  ```sql
  SELECT likes_count FROM posts WHERE id = <post_id>
  -- Debe ser = valor_anterior + 1
  ```

#### TC-LIKE-002: Prevención de duplicados (PK compuesta)
- **Precondición**: Like ya existente para `(user_id, post_id)`
- **Acción**: INSERT duplicado en `post_likes`
- **Resultado esperado**: Error `unique_violation` (PK compuesta `(user_id, post_id)`)
- **Verificación MCP**: `SELECT count(*) FROM post_likes WHERE user_id = <uid> AND post_id = <pid>` debe ser = 1

#### TC-LIKE-003: Quitar like (DELETE)
- **Acción**: DELETE del like existente
- **Resultado esperado**:
  - Trigger decrementa `posts.likes_count` en -1
  - `likes_count` nunca baja de 0 (uso de `GREATEST(0, ...)`)
- **Verificación MCP**: Validar `likes_count >= 0`

#### TC-LIKE-004: Cambio de voto up → down (UPDATE)
- **Acción**: UPDATE `vote_type` de 'up' a 'down'
- **Resultado esperado**:
  - `fn_update_posts_likes_count()` detecta el cambio y resta 1
  - CHECK constraint valida `vote_type IN ('up', 'down')`
- **Verificación MCP**: `likes_count = valor_anterior - 1`

#### TC-LIKE-005: Milestone 20 likes → +3 novas al autor
- **Precondición**: Post con `likes_count = 19`
- **Acción**: Insertar el like #20
- **Resultado esperado**:
  - Trigger `tr_check_post_likes_milestones` ejecuta `fn_check_post_likes_milestones()`
  - Se llama a `fn_award_milestone_reward(author_id, 'likes_20', post_id, 3, ...)`
  - Insert en `milestone_rewards` para prevenir re-otorgamiento
  - `profiles.novas` del autor += 3
  - Notificación creada en `notifications`
- **Verificación MCP**:
  ```sql
  SELECT novas FROM profiles WHERE id = <author_id>
  SELECT * FROM milestone_rewards WHERE user_id = <author_id> AND milestone_type = 'likes_20'
  SELECT * FROM notifications WHERE user_id = <author_id> AND type = 'reward'
  ```

#### TC-LIKE-006: Milestone 50 likes → +5 novas al autor
- **Precondición**: Post con `likes_count = 49`
- **Acción**: Insertar el like #50
- **Resultado esperado**: Misma lógica que TC-LIKE-005 pero con `likes_50` y +5 novas
- **Verificación MCP**: `milestone_type = 'likes_50'` y `novas += 5`

#### TC-LIKE-007: Milestone NO se repite (idempotencia)
- **Precondición**: Milestone `likes_20` ya otorgado para este post
- **Acción**: Quitar y re-agregar likes para volver a cruzar el umbral
- **Resultado esperado**: `milestone_rewards` ya tiene el registro, no se duplica
- **Verificación MCP**: `count(*) FROM milestone_rewards WHERE reference_id = <post_id> AND milestone_type = 'likes_20'` = 1

#### TC-LIKE-008: RLS — Solo puedes gestionar tus propios likes
- **Acción**: DELETE de un like donde `user_id ≠ auth.uid()`
- **Resultado esperado**: Denied por RLS `likes_manage_delete`

---

### 2.3 🟡 TC-REPOST — Reposts y Compartir

#### TC-REPOST-001: Repost de un post (tabla `post_reposts`)
- **Acción**: INSERT en `post_reposts` con `user_id = auth.uid()`, `post_id`
- **Resultado esperado**:
  - Trigger `tr_repost_sync_v2` ejecuta `handle_repost_counters_v2()`
  - `posts.reposts_count` += 1
- **Verificación MCP**: `SELECT reposts_count FROM posts WHERE id = <post_id>`

#### TC-REPOST-002: Repost duplicado bloqueado (PK compuesta)
- **Acción**: INSERT duplicado en `post_reposts`
- **Resultado esperado**: Error `unique_violation` (PK `(user_id, post_id)`)
- **Verificación MCP**: `SELECT count(*) FROM post_reposts WHERE user_id = <uid>` sin cambios

#### TC-REPOST-003: Deshacer repost (DELETE)
- **Acción**: DELETE del repost
- **Resultado esperado**: `posts.reposts_count` -= 1, con `GREATEST(0, ...)`
- **Verificación MCP**: `reposts_count >= 0`

#### TC-REPOST-004: Repost universal (tabla `reposts`)
- **Acción**: INSERT en `reposts` con `post_id` (puede ser null `news_id`)
- **Resultado esperado**:
  - Trigger `tr_reposts_count` ejecuta `fn_update_reposts_count()`
  - Incrementa `posts.reposts_count` o `news.reposts_count` según el campo no-null
- **Verificación MCP**: Validar que solo se actualiza la tabla correcta

#### TC-REPOST-005: Compartir post vía mensaje directo
- **Acción**: INSERT en `messages` con `is_post_share = true`, `post_id = <uuid_post>`
- **Resultado esperado**:
  - FK `messages_post_id_fkey` satisfecha
  - `is_post_share = true`
  - El mensaje aparece en la conversación del destinatario
- **Verificación MCP**: `SELECT * FROM messages WHERE post_id = <pid> AND is_post_share = true`

#### TC-REPOST-006: Notificación automática al autor en repost
- **Precondición**: El autor del post es diferente al usuario que reposta
- **Acción**: INSERT en `reposts` (que ejecuta `handle_repost_operations_v5`)
- **Resultado esperado**:
  - Insert automático en `notifications` con `type = 'repost'`, `content = 'republicó tu post'`
  - `notifications.sender_id` = usuario que reposta
  - `notifications.user_id` = autor del post
- **Verificación MCP**:
  ```sql
  SELECT * FROM notifications 
  WHERE type = 'repost' AND sender_id = <reposter_id> AND user_id = <author_id>
  ```

---

### 2.4 🟠 TC-COMMENT — Sistema de Comentarios

#### TC-COMMENT-001: Comentar en un post
- **Acción**: INSERT en `post_comments` con `post_id`, `author_id = auth.uid()`, `text`
- **Resultado esperado**:
  - Row insertada con `likes = 0`
  - Triggers:
    - `on_comment_added` → `handle_post_comment_count()` → `posts.comments_count += 1`
    - `tr_post_comments_count` → `handle_post_comment_count()` (duplicado)
    - `tr_post_comments_update` → `handle_post_comments_count()` (recálculo con COUNT)
- **Verificación MCP**: `SELECT comments_count FROM posts WHERE id = <post_id>`

#### TC-COMMENT-002: Eliminar comentario
- **Acción**: DELETE del comentario
- **Resultado esperado**: `posts.comments_count -= 1`, mínimo 0
- **Verificación MCP**: Validar coherencia entre `COUNT(*)` real y `comments_count`

#### TC-COMMENT-003: Respuesta a un comentario (hilo nivel 2)
- **Acción**: INSERT en `comment_replies` con `comment_id = <uuid_comment>`, `author_id = auth.uid()`, `text`
- **Resultado esperado**:
  - Row insertada con `likes = 0`, `parent_reply_id = null`
  - Trigger `tr_replies_count_sync` → `handle_reply_count_sync()`
- **Verificación MCP**: `SELECT count(*) FROM comment_replies WHERE comment_id = <cid>`

#### TC-COMMENT-004: Respuesta anidada a otra respuesta (hilo nivel 3+)
- **Acción**: INSERT en `comment_replies` con `parent_reply_id = <uuid_reply_existente>`
- **Resultado esperado**:
  - FK `comment_replies_parent_reply_id_fkey` satisfecha (auto-referencia)
  - `parent_reply_id` apunta a un reply válido
- **Verificación MCP**: Cadena de replies con `parent_reply_id` verificable

#### TC-COMMENT-005: Like en comentario
- **Acción**: INSERT en `comment_likes` con `comment_id = <uuid_comment>`, `user_id = auth.uid()`
- **Resultado esperado**:
  - Triggers:
    - `on_comment_like_change` → `handle_comment_likes_count()` → `post_comments.likes += 1`
    - `tr_sync_comment_likes` → `fn_sync_comment_likes()` → actualiza `post_comments` Y `news_comments`
    - `tr_check_comment_engagement_milestone` → `check_comment_engagement_milestone()` (a 21 likes)
- **Verificación MCP**: `SELECT likes FROM post_comments WHERE id = <cid>`

#### TC-COMMENT-006: Like en reply
- **Acción**: INSERT en `comment_likes` con `reply_id = <uuid_reply>`, `comment_id = null`
- **Resultado esperado**:
  - `fn_sync_comment_likes()` detecta `reply_id IS NOT NULL` y actualiza `comment_replies.likes += 1`
- **Verificación MCP**: `SELECT likes FROM comment_replies WHERE id = <rid>`

#### TC-COMMENT-007: Milestone 20 likes en comentario → +2 novas
- **Precondición**: `post_comments.likes = 19`
- **Acción**: Insertar el like #20
- **Resultado esperado**:
  - Trigger `tr_check_post_comment_likes_milestones` ejecuta `fn_check_comment_likes_milestones()`
  - `fn_award_milestone_reward(author_id, 'comment_likes_20', comment_id, 2, ...)`
  - `profiles.novas` del autor += 2
- **Verificación MCP**: `SELECT * FROM milestone_rewards WHERE milestone_type = 'comment_likes_20'`

#### TC-COMMENT-008: RLS — Solo el autor puede comentar bajo su ID
- **Acción**: INSERT en `post_comments` con `author_id ≠ auth.uid()`
- **Resultado esperado**: Denied por RLS `comments_insert`

---

### 2.5 🔴 TC-INTEGRITY — Integridad de Datos

#### TC-INTEGRITY-001: FK — Post requiere author_id válido
- **Acción**: INSERT en `posts` con `author_id` inexistente
- **Resultado esperado**: Error `foreign_key_violation` (`posts_author_id_fkey`)
- **Verificación MCP**: Row no insertada

#### TC-INTEGRITY-002: FK — Comentario requiere post_id válido
- **Acción**: INSERT en `post_comments` con `post_id` inexistente
- **Resultado esperado**: Error FK (`comments_post_id_fkey`)

#### TC-INTEGRITY-003: FK — Like requiere post_id y user_id válidos
- **Acción**: INSERT en `post_likes` con `post_id` inexistente
- **Resultado esperado**: Error FK (`likes_post_id_fkey`)

#### TC-INTEGRITY-004: CHECK — vote_type solo acepta 'up' o 'down'
- **Acción**: INSERT en `post_likes` con `vote_type = 'superlike'`
- **Resultado esperado**: Error CHECK constraint violation

#### TC-INTEGRITY-005: Coherencia de contadores tras operaciones masivas
- **Acción**: Insertar 5 likes, eliminar 2, insertar 1 más
- **Resultado esperado**: `posts.likes_count = 4`
- **Verificación MCP**:
  ```sql
  SELECT likes_count, 
         (SELECT count(*) FROM post_likes WHERE post_id = <pid>) AS real_count
  FROM posts WHERE id = <pid>
  -- Ambos deben coincidir
  ```

#### TC-INTEGRITY-006: Eliminación segura (fn_delete_post_secure)
- **Acción**: Llamar a `fn_delete_post_secure(post_id, author_id, 'post')`
- **Resultado esperado**:
  - Post copiado a `posts_deleted` con campos preservados
  - `posts_deleted.original_id = post_id`
  - Post original eliminado de `posts`
- **Verificación MCP**:
  ```sql
  SELECT count(*) FROM posts WHERE id = <post_id>          -- Debe ser 0
  SELECT * FROM posts_deleted WHERE original_id = <post_id> -- Debe existir
  ```

#### TC-INTEGRITY-007: Cascade — Likes y comentarios huérfanos al eliminar post
- **Precondición**: Post con likes y comentarios
- **Acción**: DELETE del post
- **Resultado esperado**: Verificar si existen constraints `ON DELETE CASCADE` o si quedan registros huérfanos
- **Verificación MCP**:
  ```sql
  SELECT count(*) FROM post_likes WHERE post_id = <deleted_post_id>
  SELECT count(*) FROM post_comments WHERE post_id = <deleted_post_id>
  -- Si no hay CASCADE, estos registros seguirán existiendo
  ```

#### TC-INTEGRITY-008: Contadores nunca negativos
- **Acción**: Para un post con `likes_count = 0`, ejecutar un DELETE en `post_likes`
- **Resultado esperado**: `likes_count` permanece en 0 gracias a `GREATEST(0, ...)`
- **Verificación MCP**: `SELECT likes_count FROM posts WHERE id = <pid>` = 0

---

## 3. Hallazgos Críticos de la Auditoría

> [!WARNING]
> ### 3.1 Triggers duplicados en `post_comments`
> La tabla `post_comments` tiene **3 triggers** que se ejecutan en INSERT/DELETE:
> - `on_comment_added` → `handle_post_comment_count()` (incremento +1/-1)
> - `tr_post_comments_count` → `handle_post_comment_count()` (MISMA función, duplicado)
> - `tr_post_comments_update` → `handle_post_comments_count()` (recálculo con COUNT)
> 
> Los dos primeros ejecutan la **misma función** y podrían causar **doble incremento**.
> El tercero recalcula con COUNT(*) real, lo que podría corregir o enmascarar el problema.

> [!WARNING]
> ### 3.2 Triggers duplicados en `comment_likes`
> La tabla `comment_likes` tiene **2 triggers** que actualizan contadores de likes en las mismas tablas:
> - `on_comment_like_change` → `handle_comment_likes_count()` (actualiza post_comments, news_comments, Y comment_replies por comment_id)
> - `tr_sync_comment_likes` → `fn_sync_comment_likes()` (actualiza post_comments, news_comments por comment_id, Y comment_replies por reply_id)
> 
> Ambos se ejecutan en INSERT/DELETE y podrían causar **doble incremento** de `likes`.

> [!IMPORTANT]
> ### 3.3 Tabla `comment_likes` sin UNIQUE constraint
> La PK es un `id` UUID auto-generado. No existe un UNIQUE constraint en `(user_id, comment_id)` ni `(user_id, reply_id)`.
> **Un usuario podría dar like ilimitado al mismo comentario a nivel de base de datos.**
> La prevención de duplicados dependería únicamente del frontend.

> [!IMPORTANT]
> ### 3.4 Tabla `reposts` sin UNIQUE constraint
> Similar al problema anterior: PK es `id` UUID, sin UNIQUE en `(user_id, post_id)`.
> Contrasta con `post_reposts` que SÍ tiene PK compuesta `(user_id, post_id)`.
> **Dualidad de tablas de reposts (`post_reposts` vs `reposts`)** sugiere migración incompleta.

> [!NOTE]
> ### 3.5 RLS policy `posts_deleted` demasiado permisiva
> La policy `Anyone can insert deleted posts` tiene `with_check = true` para el rol `public`.
> Esto permite que **cualquier usuario, incluso no autenticado**, inserte en `posts_deleted`.
> Debería restringirse a usuarios autenticados con `author_id = auth.uid()`.

---

## 4. Plan de Ejecución de Tests

### Fase 1: Tests de integridad básica (TC-INTEGRITY)
1. Validar FKs con INSERTs inválidos (001-003)
2. Validar CHECK constraints (004)
3. Validar coherencia de contadores (005, 008)
4. Validar eliminación segura (006)
5. Verificar comportamiento CASCADE (007)

### Fase 2: Tests de creación de contenido (TC-POST)
1. Ejecutar INSERTs con diferentes combinaciones de campos (001-005)
2. Probar escenarios negativos de FK (006)
3. Validar enforcement de RLS (007)

### Fase 3: Tests de likes (TC-LIKE)
1. Ciclo completo: dar like → verificar contador → quitar like → verificar (001-003)
2. Prevención de duplicados vía PK (002)
3. Cambio de voto (004)
4. Milestones 20 y 50 likes (005-007)
5. RLS enforcement (008)

### Fase 4: Tests de reposts y compartir (TC-REPOST)
1. Flujo completo en `post_reposts` (001-003)
2. Flujo universal en `reposts` (004)
3. Compartir vía DM (005)
4. Notificaciones automáticas (006)

### Fase 5: Tests de comentarios (TC-COMMENT)
1. Comentar y verificar contadores — **con especial atención a los triggers duplicados** (001-002)
2. Hilos de respuestas (003-004)
3. Likes en comentarios y replies (005-006)
4. Milestones de comentarios (007)
5. RLS enforcement (008)

---

## 5. Método de Ejecución

Todos los tests se ejecutarán mediante **SQL directo a través del MCP de Supabase** (`execute_sql`), lo que permite:
- ✅ Control total sobre el estado de la base de datos
- ✅ Verificación directa de triggers y contadores
- ✅ Ejecución sin necesidad de frontend
- ✅ Validación de constraints a nivel de Postgres
- ✅ Posibilidad de rollback vía transacciones

```sql
-- Patrón de ejecución por test
BEGIN;
  -- Setup: crear datos de prueba
  -- Action: ejecutar la operación bajo test
  -- Verify: consultar resultados esperados
ROLLBACK; -- No contaminar la base de datos de producción
```
