# Anteproyecto: Red Social NovaGob

**Autor:** David Cruz  
**Fecha:** 13 de Febrero de 2026  
**Ciclo Formativo:** Desarrollo de Aplicaciones Web  

---

## Índice

1.  [Formato general del anteproyecto](#1.-formato-general-del-anteproyecto)
2.  [Portada](#2.-portada)
3.  [Índice](#3.-índice)
4.  [Introducción](#4.-introducción)
5.  [Objetivo/s generales del proyecto](#5.-objetivos-generales-del-proyecto)
6.  [Objetivos específicos](#6.-objetivos-específicos)
7.  [Contexto actual](#7.-contexto-actual)
8.  [Planificación del proyecto](#8.-planificación-del-proyecto)
    *   8.1. [Acciones](#8.1.-acciones)
    *   8.2. [Temporalización y secuenciación](#8.2.-temporalización-y-secuenciación)
    *   8.3. [Recursos](#8.3.-recursos)
9.  [Relación del proyecto con los contenidos del ciclo](#9.-relación-del-proyecto-con-los-contenidos-del-ciclo)

---

## 4. Introducción

### Descripción
El proyecto consiste en el diseño y desarrollo de **Red Social NovaGob**, una plataforma web moderna orientada a la comunidad de profesionales de la administración pública. La aplicación permite a los usuarios crear perfiles, compartir contenido (publicaciones, imágenes, documentos), interactuar mediante comentarios y "me gusta", gestionar eventos y participar en un sistema de gamificación con insignias y rankings. El sistema se centra en la usabilidad, la accesibilidad y la interacción en tiempo real.

### Motivación del proyecto
La administración pública requiere espacios digitales que fomenten la colaboración ágil y la innovación abierta, más allá de las intranets tradicionales o las redes sociales generalistas. Este proyecto nace de la necesidad de ofrecer una herramienta que combine la funcionalidad de una red social moderna con las necesidades específicas de este sector (validación de perfiles, gestión de eventos profesionales, reconocimiento de méritos). Se ofrece una solución viable utilizando tecnologías web de vanguardia (React, Supabase) que garantizan escalabilidad y bajo coste de mantenimiento.

### Beneficios esperados
*   **Fomento de la colaboración:** Facilita el intercambio de conocimientos y experiencias entre empleados públicos.
*   **Reconocimiento profesional:** A través del sistema de gamificación (niveles, insignias), se motiva la participación y se visibiliza el talento.
*   **Centralización de la información:** Unifica noticias, eventos y debates en un solo "feed" personalizado.
*   **Modernización tecnológica:** Provee una experiencia de usuario (UX) fluida y adaptativa (responsive), superior a las herramientas corporativas estándar.

### Relevancia del proyecto
En el contexto actual de transformación digital, las herramientas de comunicación interna son críticas. Red Social NovaGob no solo sirve como medio de comunicación, sino como un motor de cultura organizativa, permitiendo descubrir talento oculto y mejorar el clima laboral a través de una participación activa y transparente.

## 5. Objetivo/s generales del proyecto

**Desarrollar e implantar una plataforma web de red social corporativa, escalable y segura, que integre funcionalidades de comunicación en tiempo real, gestión de eventos y gamificación, para potenciar la interacción y el desarrollo profesional dentro de la comunidad NovaGob.**

## 6. Objetivos específicos

Para alcanzar el objetivo general, se establecen los siguientes objetivos específicos o bloques de trabajo:

1.  **Implementar un sistema de autenticación y gestión de usuarios robusto**, que permita el registro, inicio de sesión seguro y la personalización avanzada de perfiles (avatar, biografía, ubicación, intereses).
2.  **Desarrollar un "Feed" interactivo y dinámico**, capaz de mostrar publicaciones ordenadas cronológicamente, soportar contenido multimedia y permitir interacciones sociales (likes, comentarios) en tiempo real.
3.  **Crear un sistema de gamificación integral**, incluyendo la lógica para asignar experiencia (XP), niveles, ranking semanal y la gestión de insignias desbloqueables basadas en la actividad del usuario.
4.  **Diseñar un módulo de gestión de eventos**, donde los usuarios puedan crear convocatorias, inscribirse y visualizar los detalles de las actividades de la comunidad.
5.  **Asegurar una interfaz de usuario totalmente "Responsive" (Adaptativa)**, garantizando una experiencia óptima tanto en dispositivos móviles como en escritorio.
6.  **Integrar una base de datos en tiempo real (Supabase)**, configurando correctamente las políticas de seguridad (Row Level Security) para proteger los datos de los usuarios.

## 7. Contexto actual

### Estado del arte
Actualmente, existen soluciones como **LinkedIn** (orientada al networking general), **Workplace from Meta** o **Slack** (comunicación corporativa). Sin embargo, muchas de estas herramientas son generalistas o tienen costes elevados de licencia. En el ámbito de la administración pública, a menudo se usan intranets obsoletas o grupos de mensajería informal (WhatsApp) que carecen de estructura y seguridad. Red Social NovaGob se posiciona como una solución híbrida: la usabilidad de una red social comercial con el enfoque y control de una herramienta corporativa, integrando gamificación de forma nativa, algo poco común en las intranets tradicionales.

### Conceptos clave
*   **SPA (Single Page Application):** Aplicación web que carga una sola página HTML y actualiza dinámicamente el contenido cuando el usuario interactúa con la aplicación.
*   **React:** Biblioteca de JavaScript para construir interfaces de usuario basadas en componentes.
*   **Supabase:** Plataforma "Backend-as-a-Service" que proporciona base de datos PostgreSQL, autenticación y actualizaciones en tiempo real.
*   **Row Level Security (RLS):** Característica de seguridad en bases de datos que restringe el acceso a las filas de una tabla basándose en las características del usuario que ejecuta una consulta.
*   **Gamificación:** Aplicación de mecánicas de juego en entornos no lúdicos para potenciar la motivación.

## 8. Planificación del proyecto

### 8.1. Acciones
El proyecto se divide en los siguientes bloques de trabajo:

1.  **Análisis y Diseño:** Definición de requisitos, diseño de la base de datos y prototipado UI/UX.
2.  **Configuración del Entorno:** Inicialización del proyecto (Vite), configuración de TailwindCSS y Supabase.
3.  **Desarrollo del Core:** Implementación de autenticación y estructura base (Layouts, Routing).
4.  **Desarrollo de Funcionalidades Principales:** CRUD de publicaciones, sistema de comentarios y perfiles de usuario.
5.  **Desarrollo de Funcionalidades Avanzadas:** Sistema de gamificación, rankings, eventos y notificaciones.
6.  **Refinamiento y Testing:** Corrección de errores, optimización de rendimiento y pruebas de usuario.
7.  **Documentación y Despliegue:** Redacción de la memoria técnica y publicación de la aplicación.

### 8.2. Temporalización y secuenciación

*Duración estimada total: 12 semanas*

| Fase | Tarea | Duración | Semanas |
| :--- | :--- | :--- | :--- |
| **1. Inicio** | Diseño de DB y Mockups | 2 semanas | Semanas 1-2 |
| **2. Core** | Setup, Auth y Layouts | 2 semanas | Semanas 3-4 |
| **3. Social** | Feed, Posts y Comentarios | 3 semanas | Semanas 5-7 |
| **4. Avanzado** | Gamificación y Eventos | 3 semanas | Semanas 8-10 |
| **5. Cierre** | Testing, Fixes y Documentación | 2 semanas | Semanas 11-12 |

### 8.3. Recursos

**Recursos Humanos:**
*   Responsable del proyecto / Desarrollador Full-Stack: Integrante del equipo (o individual).

**Recursos de Software:**
*   **Entorno de Desarrollo:** Visual Studio Code.
*   **Control de Versiones:** Git y GitHub.
*   **Frontend:** React 19, TypeScript, Vite, TailwindCSS, Lucide React (iconos).
*   **Backend / Base de Datos:** Supabase (PostgreSQL, Auth, Storage).
*   **Gestión de Paquetes:** NPM.

**Recursos de Hardware:**
*   Equipo informático personal (PC/Portátil) con conexión a Internet.

## 9. Relación del proyecto con los contenidos del ciclo

Este proyecto integra de manera transversal los conocimientos adquiridos en el Ciclo Formativo de Desarrollo de Aplicaciones Web:

*   **Desarrollo Web en Entorno Cliente:** Uso intensivo de JavaScript/TypeScript y React para la creación de interfaces dinámicas, gestión del DOM y consumo de APIs asíncronas.
*   **Desarrollo Web en Entorno Servidor:** Diseño y gestión de base de datos relacional (PostgreSQL), creación de funciones almacenadas (PL/pgSQL) y gestión de seguridad (RLS) en Supabase.
*   **Diseño de Interfaces Web:** Maquetación responsiva con CSS moderno (TailwindCSS), principios de usabilidad y accesibilidad.
*   **Despliegue de Aplicaciones Web:** Uso de control de versiones y despliegue en plataformas en la nube.
*   **Empresa e Iniciativa Emprendedora:** Planificación del proyecto, viabilidad y orientación al cliente/usuario final.

