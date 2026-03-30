# 📔 Dossier de Funcionalidades — Red Social NovaGob

Este documento detalla todas las funcionalidades implementadas y operativas en la Red Social NovaGob, diseñada para profesionales y organizaciones del sector público.

---

## 1. Acceso y Gestión de Usuarios

### 1.1 Autenticación Flexible
- **Inicio de sesión**: Entrada dual mediante **correo electrónico institucional** o **nombre de usuario**.
- **Seguridad**: Autenticación gestionada por Supabase Auth (bcrypt).
- **Recuperación**: Flujo de recuperación de contraseña con verificación de enlace vía email.

### 1.2 Registro y Onboarding
- **Tipos de Cuenta**: 
  - **Personal**: Para profesionales (puesto, administración, departamento, ubicación).
  - **Organización**: Para instituciones (objetivos, bio, ubicación).
- **Aprobación Manual**: Flujo de seguridad donde cada registro debe ser validado por un administrador antes de obtener acceso.
- **Tutorial**: Guía interactiva para nuevos usuarios en su primer acceso.

---

## 2. Interacción Social y Contenidos

### 2.1 Muro Social (Posts)
- **Creación**: Publicaciones con texto enriquecido, menciones, tags y adjuntos.
- **Multimedia**: Soporte para múltiples imágenes (galería) y documentos PDF/Doc.
- **Interacción**: 
  - **Votos**: Sistema de Likes/Dislikes (Up/Down) para medir el interés.
  - **Comentarios**: Hilos de discusión con respuestas anidadas sin límite de profundidad.
  - **Reposts**: Capacidad de compartir publicaciones de otros en el muro propio.
- **Organización**: Opción de "Fijar" publicaciones importantes en la parte superior del perfil.

### 2.2 Sistema de Noticias (News)
- **Feed Institucional**: Portal de noticias relevantes para la comunidad.
- **Engagement**: Votación y comentarios específicos para el módulo de noticias.
- **Integración**: Las noticias más populares alimentan el ranking semanal.

---

## 3. Agenda y Eventos

### 3.1 Gestión de Eventos
- **Tipos**: Físicos, Online, Reuniones y Cursos.
- **Información**: Fecha, hora, ubicación (o enlace) y descripción detallada.
- **Promoción**: Sistema de "Apoyos". Los eventos necesitan un mínimo de apoyos para destacar en el calendario principal.

### 3.2 Calendario Integrado
- Vista cronológica de eventos próximos.
- Filtros por tipo de evento y nivel de interés de la comunidad.

---

## 4. Gamificación: Sistema de Novas

### 4.1 Economía de Novas
- **Novas**: Moneda virtual que premia la participación y la calidad del contenido.
- **Bonos de Inicio**: Recompensa por registro y aprobación.
- **Bono Diario**: Premio por inicio de sesión consecutivo.

### 4.2 Logros y Recompensas (Milestones)
- **Hitos de Engagement**: Premios automáticos al alcanzar umbrales de likes (ej. 20 likes = +3 Novas).
- **Medallas (Badges)**: Distinciones visuales en el perfil según méritos y antigüedad.

### 4.3 Ranking Semanal
- **Competición Saludable**: Los autores de las noticias más votadas de la semana reciben Novas adicionales y medallas de TOP 1, 2 y 3.
- **Automatización**: Procesamiento automático cada lunes a las 00:00.

---

## 5. Comunicación y Herramientas

### 5.1 Mensajería Directa (DM)
- Chats privados entre usuarios.
- **Compartición de Contenido**: Posibilidad de enviar posts, perfiles de usuarios o eventos directamente a través de mensajes.
- **Gestión de Chat**: Estados de lectura y opciones de borrado.

### 5.2 Perfil Profesional
- Visualización de intereses, cargo, organización y ubicación.
- Contador de Novas y galería de medallas obtenidas.
- Muro de actividad personal.

---

## 6. Notificaciones y Alertas

- **Multi-canal**: Notificaciones dentro de la aplicación y avisos críticos por correo electrónico.
- **Eventos Notificables**: Nuevos seguidores, reacciones, comentarios, menciones y recompensas obtenidas.
- **Panel Administrativo**: Los administradores reciben alertas de nuevos registros pendientes de aprobación.

---

## 7. Infraestructura y Seguridad

- **Seguridad de Datos**: Implementación estricta de **Row Level Security (RLS)** en todas las tablas de la base de datos.
- **Privacidad**: Control granular sobre quién puede ver y editar la información.
- **Arquitectura**: Basada en Supabase y React para una experiencia fluida y en tiempo real.
