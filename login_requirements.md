# Requisitos de Autenticación — Red Social NovaGob

> **Spec-Driven Development (SDD)** — Este documento define el comportamiento exacto del flujo de autenticación según el código actual de producción.

---

## 1. Visión General

El sistema de autenticación se basa en **Supabase Auth** (email/password) y sigue un flujo de aprobación manual:

```
Registro → Revisión Administrador → Aprobación/Rechazo → Acceso
```

No existe auto-registro libre. Cada cuenta nueva requiere aprobación explícita de un administrador.

---

## 2. Flujo de Inicio de Sesión (`Login.tsx`)

### 2.1 Identificación flexible
El usuario puede iniciar sesión con **email** o **username**:
- Si el identificador contiene `@`, se usa directamente como email.
- Si no contiene `@`, se busca en `profiles` por `username` y se obtiene el email asociado.
- Si el username no existe o no tiene email → error: *"El nombre de usuario no existe o no tiene un email asociado."*

### 2.2 Autenticación
- Se llama a `supabase.auth.signInWithPassword({ email, password })`.
- Si falla → error: *"Credenciales incorrectas. Comprueba tu contraseña."*
- Si tiene éxito → `App.tsx` detecta la sesión vía `onAuthStateChange` y redirige automáticamente.

### 2.3 "Recordar" (`Remember Me`)
- Almacena el **identificador** (no la contraseña) en `localStorage` bajo la clave `remembered_identifier`.
- Al cargar la pantalla, si existe un identificador guardado:
  - Se pre-rellena el campo.
  - Se busca el `name` del perfil en BD para mostrar *"Te damos la bienvenida [nombre]"*.
- Si se desmarca "Recordar", se borra de `localStorage` inmediatamente.

### 2.4 Mensaje de bienvenida
- Con identificador recordado + nombre encontrado: *"Te damos la bienvenida [nombre]"*
- Sin identificador recordado: *"Te damos la bienvenida"*

---

## 3. Flujo de Recuperación de Contraseña

### 3.1 Paso 1: Solicitar enlace (`Login.tsx`, modo `isForgotPassword`)
1. El usuario introduce su correo institucional.
2. Se llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
3. `redirectTo` apunta a `${window.location.origin}/recover-password/`.
4. Se muestra un mensaje de confirmación: *"¡Correo enviado! Hemos enviado un enlace a [email]."*

### 3.2 Paso 2: Esperar confirmación (polling)
- Se inicia un **polling** cada 1500ms con `supabase.auth.getSession()`.
- También se suscribe a `supabase.auth.onAuthStateChange` para detección cross-tab.
- Cuando se detecta sesión o evento `PASSWORD_RECOVERY`:
  - Se habilita el botón **"Siguiente"** (previamente bloqueado).
  - El botón muestra: *"Esperando al mensaje..."* → *"¡Identidad verificada! Haz clic en Siguiente."*

### 3.3 Paso 3: Nueva contraseña (`PasswordRecover.tsx`)
- Se renderiza en la ruta `/recover-password/`.
- Validaciones:
  - Mínimo **8 caracteres**.
  - Ambos campos deben coincidir.
- Se llama a `supabase.auth.updateUser({ password })`.
- Tras éxito: animación de confirmación + redirección automática a `/` tras 2.5 segundos.

---

## 4. Flujo de Registro (`Onboarding.tsx`)

### 4.1 Selección de tipo de cuenta (Step 0)
El usuario elige entre:
- **Cuenta Personal**: Para profesionales del sector público.
- **Cuenta Organización**: Para instituciones y entidades.

Al continuar, se acepta implícitamente la Política de Privacidad (con enlace para leerla).

### 4.2 Registro Personal (Steps 1–7)

| Step | Contenido | Campos obligatorios |
|------|-----------|---------------------|
| 1 | Datos básicos | nombre, apellidos, username, fecha nacimiento, email, contraseña, confirmar contraseña |
| 2 | Tipo de puesto | jobCategory: Directivo / Técnico / Administrativo / Otro |
| 3 | Tipo de organización | administrationType: AGE / CCAA / Local / Otra |
| 4 | Cargo e institución | position, institution |
| 5 | Ubicación geográfica | country (default: España), region |
| 6 | Intereses | Mínimo 1 interés seleccionado |
| 7 | Foto de perfil | Opcional (tiene imagen por defecto) |

### 4.3 Registro Organización (Steps 1–3)

| Step | Contenido | Campos obligatorios |
|------|-----------|---------------------|
| 1 | Datos de organización | nombre org, objetivo (bio), username, email, contraseña, país, región |
| 2 | Intereses | Mínimo 1 interés |
| 3 | Foto de perfil | Opcional |

### 4.4 Validaciones en registro

- **Username**: No puede contener `@` ni espacios. Se fuerza a minúsculas. Se verifica disponibilidad vía consulta a `profiles` (on blur).
- **Email**: Formato válido requerido. Se verifica disponibilidad vía consulta a `profiles` (on blur).
- **Contraseña**: Mínimo 8 caracteres. Debe coincidir con confirmación.
- **Fecha de nacimiento**: El usuario debe tener al menos **18 años** (solo personal).
- **Avatar**: Máximo **5 MB** por imagen. Se recorta con `ImageCropModal`.

### 4.5 Proceso de finalización (`handleFinalize`)

1. **Sign Up**: `supabase.auth.signUp({ email, password, options: { data: profileData } })`.
2. **Manejo de "Zombie Users"**: Si error 422 ("User already registered"):
   - Se intenta `signInWithPassword` con las credenciales.
   - Si el login funciona pero no existe perfil en `profiles` → se trata como "zombie" (Auth sí, perfil no) y se permite continuar.
3. **Creación de perfil**: `supabase.from('profiles').upsert({ id, ...profileData, status: 'pending' })`.
4. **Notificación a admins**:
   - Se buscan todos los usuarios con `is_admin: true`.
   - Para cada admin:
     - Se envía **email** vía `notifyAdminNewUser()`.
     - Se crea **notificación in-app** con type `'registration_request'`.
5. **Resultado**: Se muestra modal de "Solicitud en revisión" con opción de cerrar sesión.

### 4.6 Rate Limiting
Si Supabase devuelve error 429 (rate limit), se muestra:
*"Límite de intentos excedido. Por favor, revisa tu bandeja de entrada o espera unos minutos."*

---

## 5. Control de Acceso Post-Login (`App.tsx`)

### 5.1 Gestión de sesión
```
App monta → supabase.auth.getSession() → setSession()
         → supabase.auth.onAuthStateChange() → actualiza session reactivamente
```

### 5.2 Carga del perfil
Cuando existe `session.user.id`, se llama `fetchUserProfile(uid)` que carga el perfil completo de `profiles`, incluyendo `status` y `first_time`.

### 5.3 Gates de acceso (orden de evaluación)

```
1. isLoadingAuth                    → Spinner de carga
2. session && !currentUserData      → Spinner de carga (cargando perfil)
3. session && status === 'pending'  → PendingApprovalView (sin acceso)
4. session && status === 'rejected' → RejectedApprovalView (sin acceso)
5. !session                         → Redirect a /inicio-sesion
6. session && status === 'active'   → Layout principal (acceso completo)
```

### 5.4 Vista "Pendiente" (`PendingApprovalView`)
- Mensaje: *"Tu registro ha sido completado con éxito. Un administrador debe revisar y aprobar tu solicitud."*
- Única acción: **Cerrar sesión**.

### 5.5 Vista "Rechazado" (`RejectedApprovalView`)
- Mensaje: *"Lo sentimos, tu solicitud de registro ha sido rechazada por los administradores."*
- Única acción: **Cerrar sesión**.

---

## 6. Tutorial de Primera Vez

- Cuando `profiles.first_time === true` y el usuario accede por primera vez tras aprobación:
  - Se activa `TutorialModal` automáticamente.
  - Al completar/cerrar el tutorial, se actualiza `first_time` a `false` en BD.
  - No se vuelve a mostrar.

---

## 7. Flujo Administrativo de Aprobación

### 7.1 Notificaciones de registro
Los administradores reciben notificaciones tipo `registration_request` tanto:
- **In-app**: Visible en la pestaña "Admin" de NotificationsView.
- **Email**: Enviado vía `notifyAdminNewUser()`.

### 7.2 Acciones del administrador
- **Aprobar**: `supabase.rpc('fn_resolve_registration', { p_user_id, p_notification_id, p_approve: true })`.
  - Cambia `profiles.status` a `'active'`.
  - Otorga novas iniciales de bienvenida.
  - Actualiza la notificación como resuelta: *"Solicitud de registro (aceptado)"*.
- **Rechazar**: `supabase.rpc('fn_resolve_registration', { ..., p_approve: false })`.
  - Cambia `profiles.status` a `'rejected'`.
  - Actualiza la notificación: *"Solicitud de registro (rechazado)"*.

### 7.3 Optimistic updates
Las acciones de aprobar/rechazar usan **actualizaciones optimistas**:
- La UI se actualiza inmediatamente antes de que la RPC responda.
- Si la RPC falla, se hace rollback recargando notificaciones y usuarios.

---

## 8. Rutas del Sistema

| Ruta | Componente | Condición |
|------|------------|-----------|
| `/inicio-sesion` | `Login` | Solo sin sesión |
| `/registro` | `Onboarding` | Solo sin sesión |
| `/recover-password/` | `PasswordRecover` | Con sesión (vía enlace de email) |
| `/inicio` | `Layout > SocialFeed` | Con sesión + status `active` |
| `*` (cualquier otra) | Redirect a `/inicio-sesion` | Sin sesión |

---

## 9. Seguridad

| Aspecto | Implementación |
|---------|----------------|
| **Passwords** | Nunca almacenadas localmente. Solo se usa `supabase.auth` (bcrypt en servidor). |
| **Remember Me** | Solo guarda el identificador (username/email), nunca la contraseña. |
| **Sessions** | Gestionadas por Supabase Auth (JWT). Persistencia automática vía refresh token. |
| **RLS** | Las tablas `profiles` tienen RLS activo. La consulta de username/email en login se permite para `anon` pero solo campos públicos. |
| **Rate Limiting** | Supabase aplica rate limiting nativo en `signUp` y `resetPasswordForEmail`. |
| **Encryption** | Se importa `encryption.ts` pero actualmente no se usa en el flujo de login. Disponible para futuras necesidades. |

---

## 10. Diagrama del Flujo Completo

```mermaid
flowchart TD
    A[Usuario abre la app] --> B{¿Tiene sesión?}
    B -- No --> C[/inicio-sesion/]
    B -- Sí --> D{¿Perfil cargado?}
    D -- No --> E[Spinner de carga]
    D -- Sí --> F{profiles.status?}
    
    F -- pending --> G[PendingApprovalView]
    F -- rejected --> H[RejectedApprovalView]
    F -- active --> I{first_time?}
    
    I -- true --> J[TutorialModal]
    I -- false --> K[Layout Principal]
    J --> K
    
    C -- Login --> L{Credenciales válidas?}
    L -- No --> M[Error: Credenciales incorrectas]
    L -- Sí --> D
    
    C -- Registrarse --> N[/registro/ Onboarding]
    N --> O[signUp + crear perfil status=pending]
    O --> P[Notificar admins]
    P --> G
    
    C -- Olvidé contraseña --> Q[Enviar email recovery]
    Q --> R[Polling sesión]
    R --> S[/recover-password/]
    S --> T[Actualizar contraseña]
    T --> C
    
    G -- Admin aprueba --> I
    H -- Cerrar sesión --> C
```
