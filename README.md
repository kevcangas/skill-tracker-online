# 🎯 Skill Tracker Central (Homelab & Desktop Analytics Engine)

Sistema de gestión, sincronización *offline-first* y visualización analítica de progreso de habilidades. Diseñado para centralizar los registros provenientes de aplicaciones móviles (Android + Room/SQLite) en una base de datos PostgreSQL en servidor Homelab y ofrecer un panel de control interactivo para clientes web de escritorio (PC Web SPA).

---

## 🚀 Features Principales

- 🔄 **Motor de Sincronización Offline-First (Sync Engine):**
  - **Ingesta en Lote:** Endpoints optimizados `POST /api/v1/sync/push`, `GET /api/v1/sync/pull` y `POST /api/v1/sync/batch`.
  - **Resolución de Conflictos LWW:** Algoritmo *Last-Write-Wins* basado en marcas de tiempo UTC (`updated_at`).
  - **Identificadores Únicos Universales:** Uso estricto de **UUIDv4** generados en el cliente para prevenir colisiones de IDs entre múltiples dispositivos.
  - **Soft Deletes:** Eliminación lógica mediante el atributo `is_deleted = true` para asegurar la propagación bidireccional de bajas.

---

## 📚 Documentación Detallada (Carpeta `doc/`)

La documentación completa y modular del proyecto se encuentra dividida por áreas técnicas en la carpeta [**`doc/`**](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/README.md):

| Documento | Enfoque |
| :--- | :--- |
| 🏗️ **[01. Arquitectura y Stack](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/01-arquitectura-sistema.md)** | Visión general del sistema, red interna Docker, puertos, seguridad y Traefik. |
| 🚀 **[02. Despliegue y Operaciones](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/02-despliegue-y-operaciones.md)** | Configuración `.env`, comandos Docker Compose, migraciones con Alembic y respaldos. |
| 📡 **[03. Referencia de Endpoints API](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/03-api-endpoints.md)** | Catálogo completo de endpoints REST (`/api/v1/*`) con payloads JSON y códigos HTTP. |
| 📱 **[04. Guía de Integración App Móvil](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/04-guia-app-movil-android.md)** | Configuración de red Android, permisos, modelos Room en Kotlin, flujo de usuario y sincronización con WorkManager. |


- 📊 **Dashboard Web Interactivo de Escritorio (React SPA):**
  - **Matriz de Consistencia (Heatmap):** Cuadrícula visual estilo GitHub de la intensidad de práctica diaria (últimos 60 días).
  - **Métricas Globales:** Horas totales acumuladas, rachas activas (*streaks*), recuento de habilidades y estado del servidor Homelab.
  - **Gestión Completa de Habilidades (CRUD):**
    - ➕ **Creación:** Asignación de categoría, nivel inicial y meta de horas objetivo.
    - ✏️ **Edición:** Edición directa de nombre, nivel de dominio (*Beginner, Intermediate, Advanced, Master*), meta de horas y descripción.
    - 🗑️ **Eliminación:** Eliminación lógica de habilidades (*Soft Delete*).
    - ⏱️ **Registro Rápido de Prácticas:** Modal dedicado para añadir minutos practicados y notas por sesión.
  - **Distribución por Categorías:** Barras de progreso por área (Software Engineering, Languages, Fitness, Music, etc.).

- 🔐 **Seguridad & Autenticación:**
  - Autenticación mediante **JWT (JSON Web Tokens)** transmitidos en cabecera `Authorization: Bearer <token>`.
  - Cifrado seguro de contraseñas mediante `bcrypt`.

- 💾 **Respaldos Automatizados (Backup Daemon):**
  - Contenedor dedicado que ejecuta respaldos periódicos con `pg_dump` y compresión `.sql.gz`.
  - Limpieza automática de volcados (*dumps*) antiguos basada en política de retención configurable (`BACKUP_RETENTION_DAYS`).

---

## 🛠️ Stack Tecnológico & Arquitectura

| Capa | Tecnología | Descripción / Rol |
| :--- | :--- | :--- |
| **Backend API** | Python 3.11 + FastAPI | Framework REST asíncrono, Pydantic v2 y Swagger UI (`/docs`). |
| **ORM & Migraciones**| SQLAlchemy 2.0 + Alembic | Modelado de entidades relacionales y control versionado del esquema de BD. |
| **Base de Datos** | PostgreSQL 16 (Alpine) | Fuente de verdad centralizada con verificación de estado (*health check*). |
| **Frontend Web** | React 18 + Vite + Lucide Icons | SPA reactiva de escritorio con diseño oscuro estilo *Glassmorphism*. |
| **Servidor Web SPA** | Nginx (Alpine) | Entrega de archivos estáticos y enrutamiento interno SPA. |
| **Backup Task** | Bash + pg_dump (Postgres Alpine)| Contenedor liviano para respaldos automatizados. |
| **Contenedores** | Docker & Docker Compose | Orquestación completa y reproducible del stack. |

---

## 📡 Referencia de Endpoints de la API REST

### 🔐 Autenticación (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Registro de nuevos usuarios.
- `POST /api/v1/auth/token` - Inicio de sesión y obtención del JWT bearer token.
- `GET /api/v1/auth/me` - Perfil del usuario autenticado.

### 🔄 Sincronización (`/api/v1/sync`)
- `POST /api/v1/sync/push` - Envío masivo de deltas desde el cliente móvil/web hacia PostgreSQL (Resolución LWW).
- `GET /api/v1/sync/pull?since={timestamp}` - Obtención de registros creados o modificados desde la última fecha de sync.
- `POST /api/v1/sync/batch` - Ejecución atómica combinada de push y pull en un solo viaje HTTP.

### 🎯 Gestión de Habilidades & Sesiones (`/api/v1/skills` & `/api/v1/logs`)
- `GET /api/v1/categories` | `POST /api/v1/categories` - Listado y creación de categorías.
- `GET /api/v1/skills` | `POST /api/v1/skills` - Listado y creación de habilidades.
- `PUT /api/v1/skills/{skill_id}` - Actualización de atributos de una habilidad (Nombre, Nivel, Meta, Descripción).
- `DELETE /api/v1/skills/{skill_id}` - Eliminación lógica de una habilidad (*Soft Delete*).
- `GET /api/v1/logs` | `POST /api/v1/logs` - Listado y creación de logs de sesión de práctica.

### 📊 Métricas & Analítica (`/api/v1/stats`)
- `GET /api/v1/stats/dashboard` - Obtención de estadísticas agregadas, matriz de consistencia y distribución por categorías.

---

## 🌐 Integración con Traefik (Puertos & Etiquetas de Autodescubrimiento)

Este proyecto está diseñado para ser integrado con **Traefik** mediante etiquetas de Docker (*labels*) inyectadas automáticamente por tu pipeline de CI/CD (Jenkins) o configuradas manualmente en `docker-compose.yml`.

### Puertos Expuestos por Servicio

| Servicio | Nombre Contenedor | Puerto Interno Contenedor | Puerto Mapeado Local (Dev) | Enrutamiento Traefik |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `skill_tracker_frontend` | **`3000`** | `3000` | Interfaz Web SPA de escritorio. |
| **Backend API** | `skill_tracker_backend` | **`8000`** | `8000` | Endpoints REST `/api/v1/*` y Documentación `/docs`. |
| **PostgreSQL** | `skill_tracker_postgres` | `5432` | `5432` | BD Interna (No exponer externamente en Traefik). |
| **Backup Task** | `skill_tracker_backup` | N/A | N/A | Servicio en segundo plano sin exposición de puertos. |

### Configuración de Labels de Traefik (Ejemplo para Jenkins / Producción)

Si conectas tus contenedores a la red externa de Traefik (ejemplo: `traefik_net`):

```yaml
# Configuración para el servicio Frontend (Puerto 3000)
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.skilltracker-web.rule=Host(`skilltracker.tu-homelab.net`)"
  - "traefik.http.routers.skilltracker-web.entrypoints=websecure"
  - "traefik.http.routers.skilltracker-web.tls.certresolver=myresolver"
  - "traefik.http.services.skilltracker-web.loadbalancer.server.port=3000"
  - "traefik.docker.network=traefik_net"

# Configuración para el servicio Backend API (Puerto 8000)
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.skilltracker-api.rule=Host(`api.skilltracker.tu-homelab.net`)"
  - "traefik.http.routers.skilltracker-api.entrypoints=websecure"
  - "traefik.http.routers.skilltracker-api.tls.certresolver=myresolver"
  - "traefik.http.services.skilltracker-api.loadbalancer.server.port=8000"
  - "traefik.docker.network=traefik_net"
```

---

## 💻 Guía de Despliegue y Ejecución Local

### 1. Clonar y Configurar Variables de Entorno
Copia la plantilla `.env.example` para crear tu archivo `.env`:
```powershell
cp .env.example .env
```

### 2. Levantar el Stack de Contenedores
```powershell
docker compose up --build -d
```

Verifica el estado de los contenedores:
```powershell
docker compose ps
```

### 3. Poblar Datos Iniciales de Prueba (Seeding)
Ejecuta el script de datos iniciales para contar con un usuario demo, categorías, habilidades y logs de prueba:
```powershell
docker compose exec backend python app/seed.py
```

### 4. Accesos Locales
- **Panel Web SPA:** [http://localhost:3000](http://localhost:3000)
- **Documentación Swagger / OpenAPI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Credenciales Usuario Demo:** `demo@example.com` / `password123`

---

## 🧪 Ejecución de Pruebas Automatizadas

El proyecto incluye una suite completa de pruebas con **Pytest** que valida autenticación, operaciones CRUD y resolución de conflictos LWW.

Para ejecutar los tests dentro del contenedor backend:
```powershell
docker compose exec backend pytest -v
```

---

## 📁 Estructura del Proyecto

```text
skill-tracker-online/
├── architecture.md          # Especificación técnica y diagramas de arquitectura
├── docker-compose.yml       # Orquestación de contenedores en desarrollo local
├── .env.example             # Plantilla de variables de entorno
├── README.md                # Documentación oficial del proyecto
├── backend/                 # Backend FastAPI (Python)
│   ├── Dockerfile
│   ├── alembic.ini          # Configuración de migraciones
│   ├── alembic/             # Control de versiones del esquema SQL (Alembic)
│   ├── app/
│   │   ├── api/v1/          # Routers REST (auth, sync, skills, stats)
│   │   ├── core/            # Configuración pydantic-settings, DB y JWT security
│   │   ├── models/          # Modelos SQLAlchemy (User, SkillCategory, Skill, ProgressLog, Milestone)
│   │   ├── schemas/         # Esquemas de validación Pydantic
│   │   ├── services/        # SyncEngine (Resolución de conflictos LWW)
│   │   ├── main.py          # Entrypoint FastAPI con middleware CORS
│   │   └── seed.py          # Script de datos iniciales
│   └── tests/               # Suite de pruebas unitarias e integración (Pytest)
├── frontend/                # Web Desktop SPA (React 18 + Vite)
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/      # Componentes (Heatmap, SkillList, EditSkillModal, LogModal, NewSkillModal, Header, StatsCards)
│   │   ├── App.jsx          # Componente principal con reactividad e integración a la API
│   │   ├── main.jsx
│   │   └── index.css        # Estilos Glassmorphism en CSS Vánilla
│   └── index.html
└── backup/                  # Servicio de respaldos automáticos
    ├── Dockerfile
    └── backup.sh            # Script de pg_dump comprimido y política de retención
```
