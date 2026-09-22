# 🚀 02. Despliegue, Operaciones y Mantenimiento

Esta guía detalla el procedimiento para configurar, desplegar y mantener en operación **Skill Tracker Central** en entornos de desarrollo local y servidores Homelab.

---

## 📋 Requisitos Previos

- **Docker Desktop** (en Windows/macOS) o **Docker Engine + Docker Compose Plugin** (en Linux).
- **Git** para clonación y control de versiones.
- Puertos libres en el host: `3000` (Frontend), `8000` (Backend API), `5432` (PostgreSQL opcional si se expone externamente).

---

## ⚙️ 1. Configuración de Variables de Entorno

Copia el archivo de plantilla [.env.example](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/.env.example) para generar tu archivo `.env`:

```powershell
cp .env.example .env
```

### Parámetros Principales en `.env`:

```ini
# Base de Datos PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro_postgres
POSTGRES_DB=skilltracker
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Backend FastAPI & Seguridad JWT
SECRET_KEY=clave_secreta_jwt_de_minimo_32_caracteres_aleatorios
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200   # 30 días de validez de sesión
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000

# Puertos expuestos en el Host
BACKEND_PORT=8000
FRONTEND_PORT=3000
DB_PORT=5432

# Servicio de Respaldos (Backup Daemon)
BACKUP_RETENTION_DAYS=7
BACKUP_CRON_SCHEDULE=0 3 * * *      # Todos los días a las 03:00 AM
```

---

## 🐳 2. Levantar el Stack de Contenedores

Ejecuta el siguiente comando en la raíz del proyecto para compilar las imágenes e iniciar los contenedores en segundo plano:

```powershell
docker compose up --build -d
```

### Verificación del Estado de los Servicios:

```powershell
docker compose ps
```

Deberás observar 4 contenedores en estado `Up`:
- `skill_tracker_postgres` (con estado `healthy`)
- `skill_tracker_backend`
- `skill_tracker_frontend`
- `skill_tracker_backup`

### Consulta de Registros (Logs en vivo):

```powershell
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs únicamente del backend
docker compose logs -f backend
```

---

## 🗄️ 3. Migraciones de Base de Datos (Alembic)

El contenedor del backend ejecuta automáticamente `alembic upgrade head` al arrancar. Si necesitas inspeccionar o ejecutar migraciones manualmente:

### Aplicar migraciones pendientes:
```powershell
docker compose exec backend alembic upgrade head
```

### Consultar la versión actual del esquema:
```powershell
docker compose exec backend alembic current
```

### Generar una nueva migración tras modificar modelos SQLAlchemy:
```powershell
docker compose exec backend alembic revision --autogenerate -m "descripcion_del_cambio"
```

> [!NOTE]
> Las revisiones quedan almacenadas en el directorio [backend/alembic/versions/](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/backend/alembic/versions). Actualmente incluye la migración inicial `001_initial_schema` y la migración `002_add_is_archived_and_milestone_fields`.

---

## 🌱 4. Datos Iniciales de Prueba (Seeding)

Para poblar la base de datos con un usuario demo, categorías iniciales, habilidades de ejemplo y registros de práctica:

```powershell
docker compose exec backend python app/seed.py
```

### Credenciales del Usuario Demo:
- **Email:** `demo@example.com`
- **Contraseña:** `password123`

---

## 🧪 5. Pruebas Automatizadas (Pytest)

El backend cuenta con una suite completa de pruebas unitarias y de integración que validan el ciclo de autenticación, CRUD y el motor de sincronización con resolución de conflictos LWW:

```powershell
docker compose exec backend pytest -v
```

---

## 💾 6. Política de Respaldos y Restauración

El servicio `backup` ([backup/backup.sh](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/backup/backup.sh)) crea volcados diarios comprimidos mediante `pg_dump` y elimina automáticamente respaldos con antigüedad superior a `BACKUP_RETENTION_DAYS`.

### Forzar un respaldo inmediato:
```powershell
docker compose exec backup /backup.sh
```

### Ubicación de los respaldos:
Los archivos se guardan en el volumen de Docker `backup_data`, con el formato:
`skilltracker_backup_YYYY-MM-DD_HHMMSS.sql.gz`

### Restauración de un respaldo:
```powershell
# Descomprimir y aplicar volcado en PostgreSQL
docker compose exec -T postgres gunzip -c /backups/skilltracker_backup_YYYY-MM-DD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U postgres -d skilltracker
```

---

## 🌐 7. Integración con Traefik / Reverse Proxy

Para exponer la plataforma hacia Internet mediante tu proxy inverso (Traefik, Nginx Proxy Manager o Cloudflare Tunnel), conecta los contenedores a la red de tu proxy (ejemplo `traefik_net`) y declara las etiquetas correspondientes en [docker-compose.yml](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/docker-compose.yml):

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.skilltracker-web.rule=Host(`skilltracker.tu-homelab.net`)"
  - "traefik.http.routers.skilltracker-web.entrypoints=websecure"
  - "traefik.http.routers.skilltracker-web.tls.certresolver=myresolver"
  - "traefik.http.services.skilltracker-web.loadbalancer.server.port=3000"
  - "traefik.docker.network=traefik_net"
```
