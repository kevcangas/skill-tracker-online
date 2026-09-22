# 🏗️ 01. Arquitectura y Stack del Sistema

**Skill Tracker Central** es una plataforma centralizada de analítica, gestión y sincronización *offline-first* para el seguimiento de habilidades, sesiones de práctica, hitos y tareas.

---

## 📐 Visión General de la Arquitectura

El sistema está diseñado bajo el principio de **fuente única de verdad (Single Source of Truth)** en un entorno Homelab / Servidor, interactuando con dos tipos de clientes:
1. **Clientes Móviles (Android + Room SQLite):** Clientes con funcionamiento desconectado (*offline-first*), que acumulan datos localmente y sincronizan mediante un motor de conciliación temporal (*Last-Write-Wins*).
2. **Clientes de Escritorio (Web SPA):** Interfaz analítica reactiva para visualización densa de datos (mapas de calor de consistencia, estadísticas agregadas, gestión CRUD en tiempo real).

```text
       ┌────────────────────────────────────────────────────────┐
       │                   Dispositivos Cliente                 │
       │                                                        │
       │   [ Android App ]                    [ PC / Web Browser]
       │   (Room / SQLite)                    (React 18 SPA)    │
       └──────────┬─────────────────────────────────┬───────────┘
                  │                                 │
                  │ HTTPS / JSON                    │ HTTP / Web Assets
                  │ (Sync Batch / REST)             │ (Nginx :3000)
                  ▼                                 ▼
       ┌────────────────────────────────────────────────────────┐
       │          Servidor Homelab / Red de Contenedores        │
       │                                                        │
       │   ┌────────────────────────────────────────────────┐   │
       │   │   skill_tracker_frontend (Nginx Alpine :3000)  │   │
       │   └──────────────────────┬─────────────────────────┘   │
       │                          │                             │
       │                          ▼                             │
       │   ┌────────────────────────────────────────────────┐   │
       │   │   skill_tracker_backend (FastAPI :8000)        │   │
       │   │   - SyncEngine (LWW Conflict Resolution)       │   │
       │   │   - REST Endpoints (/api/v1/*)                 │   │
       │   │   - Auth & Security (JWT Bearer)               │   │
       │   └──────────────────────┬─────────────────────────┘   │
       │                          │                             │
       │                          ▼                             │
       │   ┌────────────────────────────────────────────────┐   │
       │   │   skill_tracker_postgres (PostgreSQL 16 :5432) │   │
       │   │   - Base de datos centralizada                 │   │
       │   └──────────────────────▲─────────────────────────┘   │
       │                          │ pg_dump                     │
       │   ┌──────────────────────┴─────────────────────────┐   │
       │   │   skill_tracker_backup (Cron + pg_dump)        │   │
       │   │   - Respaldos comprimidos (.sql.gz)            │   │
       │   └────────────────────────────────────────────────┘   │
       └────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Función Principal |
| :--- | :--- | :--- |
| **Backend REST API** | Python 3.11 + FastAPI + Pydantic v2 | API asíncrona de alto rendimiento, esquemas tipados y documentación OpenAPI (`/docs`). |
| **ORM & Migraciones** | SQLAlchemy 2.0 + Alembic | Capa de abstracción de datos relacional y versionamiento estricto de esquema de base de datos. |
| **Base de Datos** | PostgreSQL 16 (Alpine) | Motor relacional robusto con transacciones ACID, tipos UUID e índices B-tree en campos de sincronización. |
| **Frontend Web** | React 18 + Vite + Lucide Icons | SPA de escritorio con diseño moderno en modo oscuro (*Glassmorphism*), rendimiento optimizado y CSS Vanilla. |
| **Servidor Web SPA** | Nginx (Alpine) | Despacho de estáticos del frontend y manejo de enrutamiento SPA (*fallback* a `index.html`). |
| **Backup Daemon** | Bash + pg_dump (PostgreSQL Alpine) | Contenedor automatizado con rotación y retención configurable de volcados de base de datos. |
| **Orquestación** | Docker & Docker Compose | Aislamiento en red bridge privada (`skill_tracker_net`) y entornos reproducibles. |

---

## 🌐 Servicios y Mapeo de Puertos

Los servicios configurados en [docker-compose.yml](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/docker-compose.yml) se comunican a través de una red interna tipo puente (`skill_tracker_net`):

| Servicio | Contenedor | Puerto Interno | Puerto Host (Dev) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| `frontend` | `skill_tracker_frontend` | `3000` | `3000` | Panel analítico SPA accesible desde el navegador web. |
| `backend` | `skill_tracker_backend` | `8000` | `8000` | Endpoints API REST `/api/v1/*` y Swagger UI `/docs`. |
| `postgres` | `skill_tracker_postgres` | `5432` | `5432` | Motor de base de datos relacional PostgreSQL. |
| `backup` | `skill_tracker_backup` | N/A | N/A | Tarea cron periódica interna (sin exposición de puertos). |

---

## 🔒 Modelo de Seguridad y Autenticación

1. **JSON Web Tokens (JWT):**
   - Transmisión mediante cabecera estándar HTTP `Authorization: Bearer <token>`.
   - Firma mediante clave simétrica (`SECRET_KEY`) utilizando el algoritmo `HS256`.
   - Expiración configurable mediante la variable de entorno `ACCESS_TOKEN_EXPIRE_MINUTES`.
2. **Cifrado de Credenciales:**
   - Contraseñas procesadas mediante función unidireccional `bcrypt` con sal (*salt*) aleatoria.
3. **Aislamiento Multi-usuario:**
   - Todas las tablas (`categories`, `skills`, `progress_logs`, `milestones`) poseen clave foránea `user_id` vinculada a `users.id`.
   - Cada consulta en el backend extrae el usuario autenticado del token y restringe el acceso estrictamente a sus registros.
4. **Política CORS:**
   - Configurable mediante `CORS_ORIGINS` en `.env` para autorizar únicamente los orígenes frontend legítimos.
