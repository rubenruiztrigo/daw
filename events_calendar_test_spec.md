# 📋 Events & Calendar — Especificación de Tests (SDD)

> **Proyecto**: RedSocialNovaGob  
> **Fecha**: 2026-03-19  
> **Autor**: QA Senior Agent  
> **Método**: Spec-Driven Development (SDD)  
> **Fuente de datos**: Auditoría en vivo via Supabase MCP + CalendarView.tsx

---

## 1. Inventario del Sistema Auditado

### 1.1 Tablas principales (2)

| Tabla | RLS | Filas | PK | Rol |
|---|---|---|---|---|
| `user_events` | ✅ (4 policies) | 8 | `id` (uuid) | Eventos creados por usuarios |
| `event_supports` | ✅ (3 policies) | 13 | `id` (uuid) + UNIQUE `(user_id, event_id)` | Apoyos a eventos |

### 1.2 Esquema `user_events`

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `creator_id` | uuid | NO | — | FK → `profiles(id)` CASCADE |
| `title` | text | NO | — | Obligatorio |
| `event_date` | date | NO | — | Obligatorio |
| `event_time` | time | NO | — | Obligatorio |
| `location` | text | NO | — | Obligatorio |
| `description` | text | NO | — | Obligatorio |
| `type` | text | NO | — | `physical` / `online` / `online_course` / `meeting` |
| `attendees_count` | integer | SÍ | `0` | Counter de apoyos |
| `created_at` | timestamptz | SÍ | `now()` | — |

### 1.3 Esquema `event_supports`

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | NO | FK → `profiles(id)` CASCADE |
| `event_id` | uuid | NO | FK → `user_events(id)` CASCADE |
| `created_at` | timestamptz | SÍ | `now()` |

### 1.4 Trigger activo (1)

| Trigger | Tabla | Evento | Función |
|---|---|---|---|
| `on_event_support_change` | `event_supports` | AFTER INSERT/DELETE | `handle_event_support_sync()` |

**Función `handle_event_support_sync()`:**
```sql
-- INSERT → attendees_count + 1
-- DELETE → attendees_count = GREATEST(0, attendees_count - 1)
```

### 1.5 Constraints (6)

| Constraint | Tabla | Tipo | Definición |
|---|---|---|---|
| `user_events_pkey` | `user_events` | PK | `id` |
| `user_events_creator_id_fkey` | `user_events` | FK | `→ profiles(id) ON DELETE CASCADE` |
| `event_supports_pkey` | `event_supports` | PK | `id` |
| `event_supports_user_id_event_id_key` | `event_supports` | **UNIQUE** | `(user_id, event_id)` — **previene apoyo duplicado** |
| `event_supports_event_id_fkey` | `event_supports` | FK | `→ user_events(id) ON DELETE CASCADE` |
| `event_supports_user_id_fkey` | `event_supports` | FK | `→ profiles(id) ON DELETE CASCADE` |

### 1.6 Políticas RLS (7)

| Tabla | Política | Operación | Restricción |
|---|---|---|---|
| `user_events` | `events_manage_insert` | INSERT | `creator_id = auth.uid()` (authenticated) |
| `user_events` | `events_read` | SELECT | `true` (authenticated) |
| `user_events` | `events_manage_update` | UPDATE | `creator_id = auth.uid()` (authenticated) |
| `user_events` | `events_manage_delete` | DELETE | `creator_id = auth.uid()` (authenticated) |
| `event_supports` | `event_supports_insert_policy` | INSERT | `user_id = auth.uid()` (authenticated) |
| `event_supports` | `event_supports_select_policy` | SELECT | `true` (**public** — sin auth) |
| `event_supports` | `event_supports_delete_policy` | DELETE | `user_id = auth.uid()` (authenticated) |

### 1.7 Filtro del Calendario (Frontend)

```typescript
// CalendarView.tsx → línea 91-95
const { data, error } = await supabase
  .from('user_events')
  .select('*')
  .gte('attendees_count', 50)  // ← FILTRO CLAVE: solo ≥50 apoyos
  .order('event_date', { ascending: true });
```

---

## 2. Especificaciones de Test por Dominio

### 2.1 🟢 TC-EVENT — Creación de Eventos (6 tests)

#### TC-EVENT-001: Campos obligatorios
- **Verificación**: Todos los campos NOT NULL del schema
- **Resultado esperado**: `title`, `event_date`, `event_time`, `location`, `description`, `type`, `creator_id` — todos NOT NULL

#### TC-EVENT-002: Defaults correctos
- **Verificación**: `attendees_count = 0`, `created_at = now()`, `id = gen_random_uuid()`
- **Query MCP**: `SELECT * FROM user_events ORDER BY created_at DESC LIMIT 1`

#### TC-EVENT-003: Tipos de evento válidos
- **Datos reales**: `physical`, `online`, `online_course`, `meeting`
- **Verificación**: No hay CHECK constraint → cualquier valor aceptado a nivel DB
- **⚠️ Observación**: Falta CHECK constraint para `type`

#### TC-EVENT-004: FK creator_id → profiles
- **Acción**: Verificar `user_events_creator_id_fkey` ON DELETE CASCADE
- **Resultado esperado**: Error FK al insertar con creator_id inexistente

#### TC-EVENT-005: Validación de fechas
- **Datos reales**: Evento con `event_date = '3231-04-12'` y otro con `'1988-08-31'`
- **⚠️ Observación**: No hay CHECK para validar fechas futuras a nivel DB

#### TC-EVENT-006: RLS — Solo el creador gestiona
- **Verificación**: 4 policies CRUD en `user_events`, todas restringidas a `creator_id = auth.uid()`

---

### 2.2 🔵 TC-SUPPORT — Promoción y Apoyos (7 tests)

#### TC-SUPPORT-001: Apoyo a evento (INSERT)
- **Acción**: INSERT en `event_supports` con `user_id = auth.uid()`, `event_id`
- **Resultado esperado**: Trigger `handle_event_support_sync()` → `attendees_count += 1`

#### TC-SUPPORT-002: Prevención de apoyo duplicado (UNIQUE constraint)
- **Acción**: INSERT duplicado `(user_id, event_id)`
- **Resultado esperado**: Error `unique_violation` por `event_supports_user_id_event_id_key`

#### TC-SUPPORT-003: Quitar apoyo (DELETE)
- **Acción**: DELETE del support
- **Resultado esperado**: `attendees_count = GREATEST(0, attendees_count - 1)`

#### TC-SUPPORT-004: Prevención de contadores negativos
- **Verificación**: Función usa `GREATEST(0, attendees_count - 1)`
- **Resultado esperado**: Counter nunca < 0

#### TC-SUPPORT-005: Coherencia `attendees_count` vs COUNT(*) real
- **Verificación directa**: Comparar almacenado vs real en todas las filas
- **⚠️ Hallazgo previo**: 3 eventos con drift (+2, +1, +2)

#### TC-SUPPORT-006: FK validation — event_id debe existir
- **Acción**: INSERT con `event_id` inexistente
- **Resultado esperado**: Error FK `event_supports_event_id_fkey`

#### TC-SUPPORT-007: RLS — Solo el propio usuario puede apoyar/quitar apoyo
- **Verificación**: INSERT y DELETE restringidos a `user_id = auth.uid()`

---

### 2.3 🟣 TC-CALENDAR — Filtro del Calendario (5 tests)

#### TC-CALENDAR-001: Solo eventos con ≥50 apoyos aparecen
- **Query real**: `.gte('attendees_count', 50)` (CalendarView.tsx:94)
- **Verificación MCP**: `SELECT count(*) FROM user_events WHERE attendees_count >= 50`
- **Resultado esperado actual**: 0 eventos visibles en calendario (ninguno tiene ≥50)

#### TC-CALENDAR-002: Frontera del filtro (49 vs 50 apoyos)
- **Escenario**: Evento con exactamente 49 apoyos → no visible
- **Escenario**: Evento con exactamente 50 apoyos → visible
- **Verificación**: La query usa `.gte()` (>=), no `.gt()` (>)

#### TC-CALENDAR-003: Orden cronológico
- **Query real**: `.order('event_date', { ascending: true })`
- **Resultado esperado**: Eventos ordenados de más antiguo a más reciente

#### TC-CALENDAR-004: Mapping de tipos en frontend
- **Lógica**: `online_course` y `meeting` → se mapean a `'online'` en CalendarView
- **Verificación**: Solo `physical` y `online` se muestran como tipos finales

#### TC-CALENDAR-005: Integridad del conteo de supports vs filtro
- **Impacto**: Si `attendees_count` está desincronizado, el filtro mostrará/ocultará eventos incorrectamente
- **Verificación**: Los 3 eventos con drift → ¿alguno estaría en el borde de 50?

---

### 2.4 🔴 TC-SECURITY — Seguridad RLS (5 tests)

#### TC-SECURITY-001: Usuarios no autenticados no pueden crear eventos
- **Verificación**: `events_manage_insert` solo permite `authenticated`

#### TC-SECURITY-002: Usuarios no autenticados no pueden apoyar
- **Verificación**: `event_supports_insert_policy` solo permite `authenticated`

#### TC-SECURITY-003: Solo el creador puede editar/eliminar su evento
- **Verificación**: `events_manage_update` y `events_manage_delete` usan `creator_id = auth.uid()`

#### TC-SECURITY-004: SELECT de supports es público
- **Verificación**: `event_supports_select_policy` usa `true` con rol `public`
- **⚠️ Observación**: ¿Debería ser `authenticated` en vez de `public`?

#### TC-SECURITY-005: Solo el propio usuario puede quitar su apoyo
- **Verificación**: `event_supports_delete_policy` usa `user_id = auth.uid()`

---

## 3. Hallazgos Previos a Ejecución

> [!WARNING]
> ### 3.1 Counter drift en 3 eventos
> | Evento | Stored | Real | Drift |
> |---|---|---|---|
> | Reunión Rubén y Ana | 3 | 1 | +2 |
> | Tutoría Rubén y Ana | 3 | 2 | +1 |
> | Tutoría de Rubén y Ana | 3 | 1 | +2 |
> Los contadores almacenados son mayores que el conteo real de supports.

> [!NOTE]
> ### 3.2 Sin CHECK constraint en `type`
> Cualquier string es aceptado como tipo de evento a nivel DB.
> Valores en producción: `online`, `physical`, `online_course`, `meeting`.

> [!NOTE]
> ### 3.3 Sin validación de fechas
> Existen eventos con `event_date = '3231-04-12'` (futuro extremo) y `'1988-08-31'` (pasado).
> No hay CHECK constraint que valide rangos de fecha.

> [!NOTE]
> ### 3.4 `event_supports` SELECT es público
> La policy permite que usuarios no autenticados lean los apoyos.
> Considerar cambiar a `authenticated` según el `security_manifesto`.

---

## 4. Plan de Ejecución (4 Fases)

### Fase 1: Integridad y Constraints
- Validar FKs, PK, UNIQUE
- Verificar CASCADE behavior
- Counter coherence (encontrar los 3 drifts)

### Fase 2: Creación de Eventos
- Verificar campos NOT NULL y defaults
- Verificar tipos y fechas anómalas
- RLS coverage

### Fase 3: Apoyos y Filtro del Calendario
- Verificar UNIQUE anti-duplicados
- Counter coherence post-trigger
- Filtro `>=50` con datos reales

### Fase 4: Seguridad RLS
- 7 policies verificadas
- SELECT público en `event_supports`

---

## 5. Fixes Propuestos

### Fix A: Reconciliar contadores de attendees
```sql
UPDATE user_events SET attendees_count = sub.real_count
FROM (
    SELECT ue.id, (SELECT count(*) FROM event_supports WHERE event_id = ue.id) AS real_count
    FROM user_events ue
) sub
WHERE user_events.id = sub.id AND user_events.attendees_count != sub.real_count;
```

### Fix B (opcional): Añadir CHECK constraint para type
```sql
ALTER TABLE user_events ADD CONSTRAINT chk_event_type 
    CHECK (type IN ('physical', 'online', 'online_course', 'meeting'));
```
