# Arquitectura Técnica: Sistema de Sincronización y Visualización de Avance de Habilidades (Homelab)

Este documento detalla la arquitectura recomendada, el flujo paso a paso de los datos y las mejores prácticas de ingeniería para extender una aplicación móvil de tracking de habilidades (con almacenamiento local SQLite) hacia una solución multiplataforma con servidor central en homelab y cliente web de escritorio.

---

## 1. Visión General y Diagrama de Arquitectura

El diseño sigue el patrón **Offline-First (cliente móvil)** combinado con un **Backend de Consolidación Centralizado (Homelab)** y una **Web SPA para Análisis y Gestión**.

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                       CLIENTES                              │
       │                                                             │
       │   [ Android App ]                    [ PC / Web Browser ]   │
       │    (Room / SQLite)                    (React / Next.js)     │
       │   • Offline-First                    • Dashboards & Stats   │
       │   • Cache local & Queue              • Gestión y visualización
       └──────────────┬──────────────────────────────┬───────────────┘
                      │                              │
                      │ HTTPS (REST / JWT)           │ HTTPS (REST / JWT)
                      ▼                              ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   CAPA DE RED & ENLACE                      │
       │                                                             │
       │              [ Cloudflare Tunnel / Tailscale ]              │
       │                 (Acceso seguro sin port forwarding)         │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   HOMELAB CORE STACK                        │
       │                                                             │
       │              [ Reverse Proxy: Traefik / Caddy ]             │
       │                 • Terminación TLS                           │
       │                 • Rate limiting & Headers de seguridad      │
       │                              │                              │
       │                              ▼                              │
       │                 [ Backend API: FastAPI ]                    │
       │                 • Endpoints REST / Sincronización           │
       │                 • Autenticación JWT                         │
       │                 • Validación con Pydantic                   │
       │                 • ORM / Migraciones (SQLAlchemy + Alembic)  │
       │                              │                              │
       │                              ▼                              │
       │                 [ Base de Datos: PostgreSQL ]               │
       │                 • Fuente de verdad centralizada             │
       │                 • Consultas analíticas y series temporales  │
       │                              │                              │
       │                              ▼                              │
       │                 [ Tareas de Respaldo: Cron ]                │
       │                 • pg_dump automatizado y cifrado            │
       └─────────────────────────────────────────────────────────────┘
```

---

## 2. Descripción Paso a Paso del Flujo de Datos

### Paso 1: Captura Local en Dispositivo Móvil (Android + SQLite)
* **Acción:** El usuario interactúa con la app móvil para registrar avances, sesiones de práctica, nuevos niveles de dominio o notas.
* **Mecanismo:**
  1. Los datos se escriben inmediatamente en SQLite local asegurando respuesta instantánea en la interfaz gráfica (latencia cero).
  2. Cada registro genera o actualiza los campos de metadatos de sincronización: `updated_at` (UTC timestamp), `is_deleted` (soft delete) y `sync_status = 'PENDING'`.
  3. La clave primaria de cada entidad se genera en el cliente como un **UUID v4** en lugar de enteros auto-incrementables para evitar colisiones entre dispositivos.

### Paso 2: Detección de Red y Sincronización Diferencial (Sync Engine)
* **Acción:** Un worker en segundo plano (usando `WorkManager` en Android) detecta conectividad de red activa y segura.
* **Mecanismo:**
  1. La app consulta su última marca de sincronización global exitosa (`last_synced_at`).
  2. Envía en un solo payload HTTP POST `/api/v1/sync/push` todos los registros con `sync_status = 'PENDING'`.
  3. Solicita mediante HTTP GET `/api/v1/sync/pull?since={last_synced_at}` los cambios realizados desde otros clientes (ej. creados o modificados desde la web).
  4. Al recibir confirmación exitosa (`HTTP 200 OK`), marca los registros locales como `sync_status = 'SYNCED'`.

### Paso 3: Transporte Seguro y Enrutamiento (Network & Reverse Proxy)
* **Acción:** El tráfico cruza desde Internet hacia el servidor del homelab.
* **Mecanismo:**
  1. En lugar de exponer puertos públicos en el router residencial (Port Forwarding), se utiliza **Cloudflare Tunnels** o una red privada segura con **Tailscale**.
  2. El reverse proxy local (**Traefik** o **Caddy**) recibe la conexión cifrada, valida headers de seguridad, aplica limitación de tasa (rate limiting) y enruta la petición al contenedor de FastAPI.

### Paso 4: Procesamiento de Negocio e Ingestión (FastAPI)
* **Acción:** La API valida los payloads entrantes y resuelve conflictos.
* **Mecanismo:**
  1. **Autenticación:** Valida el token JWT en el header `Authorization: Bearer <token>`.
  2. **Validación de esquema:** Pydantic valida tipos de datos y restricciones de formato.
  3. **Resolución de conflictos (Last-Write-Wins / Versioning):** Si un registro recibido tiene un `updated_at` más reciente que el existente en PostgreSQL, se actualiza; de lo contrario, se descarta o se notifica divergencia.
  4. **Persistencia:** Realiza las transacciones atómicas en PostgreSQL mediante SQLAlchemy / SQLModel.

### Paso 5: Visualización y Operación en Cliente Web (PC / Desktop)
* **Acción:** El usuario accede a la interfaz web desde una PC de escritorio para análisis detallado y planificación.
* **Mecanismo:**
  1. La aplicación web (SPA con React/Next.js o Svelte) consulta los endpoints REST optimizados.
  2. Permite vistas analíticas complejas: mapas de calor de consistencia, gráficos de progreso temporal, jerarquías de habilidades y dependencias entre materias.
  3. Las modificaciones hechas en la web impactan directamente a PostgreSQL con un nuevo `updated_at`, quedando disponibles para el próximo pull del móvil.

### Paso 6: Respaldo Automatizado de Datos
* **Acción:** Preservación de la información frente a fallos de hardware o corrupción.
* **Mecanismo:**
  1. Un contenedor ligero con cron ejecuta `pg_dump` de forma diaria o semanal.
  2. El dump se comprime (`.sql.gz`), se cifra y se almacena en un disco secundario del homelab o se envía a un bucket externo (S3 Standard/Glacier o rclone).
  3. Se mantiene una política de retención (ej. 7 diarios, 4 semanales, 12 mensuales).

---

## 3. Comentarios y Mejores Prácticas de Desarrollo

### A. Gestión de Identificadores y Persistencia
* **Uso estricto de UUIDs (v4 o v7):**
  * *Problema:* Si la app móvil y la web generan IDs enteros secuenciales (`1, 2, 3...`), se producirán colisiones destructivas al intentar fusionar datos en PostgreSQL.
  * *Mejor práctica:* Emplear identificadores únicos universales generados en el cliente en el momento exacto de la creación del registro. Si se requiere ordenación temporal nativa por ID, **UUIDv7** es ideal.
* **Soft Deletes obligatorios:**
  * No ejecutar `DELETE FROM ...` físicamente. Usar un campo booleano `is_deleted = TRUE` junto con un timestamp `deleted_at`. De lo contrario, un registro borrado en Android no podrá sincronizar su eliminación al servidor (el servidor no sabrá que dejó de existir).

### B. Diseño de la Base de Datos y Modelado
* **Esquema relacional sólido:**
  * Estructurar el modelo en tablas normalizadas: `skills`, `skill_categories`, `progress_logs`, `milestones`.
  * Aprovechar los índices de PostgreSQL en columnas de búsqueda y filtrado de sync: `(user_id, updated_at)` y `(is_deleted)`.
* **Migraciones controladas y versionadas:**
  * En el backend, utilizar **Alembic** para cualquier modificación al esquema de PostgreSQL. Nunca alterar tablas manualmente.
  * En Android, configurar migraciones formales en Room Database para evitar pérdidas de datos al actualizar la app móvil.

### C. Seguridad e Infraestructura en Homelab
* **Eliminar el Port Forwarding tradicional:**
  * Abrir puertos (como 80/443 o peor aún, el puerto de PostgreSQL 5432) hacia la IP pública de tu casa expone tu red a escaneos automatizados y ataques de denegación de servicio.
  * Usar **Cloudflare Tunnels** con Cloudflare Access (WAF / autenticación perimetral) o **Tailscale** para acceso cerrado entre tus propios dispositivos autorizados.
* **Aislamiento en contenedores (Docker Compose):**
  * Mantener PostgreSQL y FastAPI en una red interna de Docker (`bridge` interna). Únicamente el Reverse Proxy debe tener puertos expuestos o comunicación con el túnel.
  * La base de datos nunca debe ser accesible directamente desde fuera del host de Docker.

### D. Optimización de la API (FastAPI)
* **Endpoints de sincronización por lotes (Batch Endpoints):**
  * Evitar hacer una llamada HTTP individual por cada fila actualizada.
  * Proveer endpoints masivos: `POST /api/v1/sync/batch` capaz de recibir una lista de entidades en una sola transacción (`db.commit()` atómico).
* **Estandarización de zonas horarias:**
  * Almacenar **absolutamente todos** los timestamps en formato UTC (`TIMESTAMP WITH TIME ZONE` en Postgres, enteros epoch milisegundos o strings ISO-8601 en SQLite).
  * Las conversiones a la zona horaria local deben ocurrir exclusivamente en la capa de presentación (UI de Android y UI Web).

### E. Frontend y Experiencia de Usuario (Web)
* **Separación clara de responsabilidades:**
  * La web debe comportarse como un cliente API más, utilizando los mismos endpoints que la app móvil (o extensiones analíticas de solo lectura).
  * Implementar estado reactivo eficiente (ej. TanStack Query / SWR) para cachear respuestas, evitar refetching innecesario y ofrecer feedback optimista en la interfaz.

---

## 4. Stack Tecnológico Sugerido

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Móvil (Cliente)** | Android (Kotlin) + Room (SQLite) | Mantiene el funcionamiento offline sin latencia y aprovecha el código ya existente. |
| **Web (Cliente)** | React / Next.js o SvelteKit | Ideal para construir tableros visuales, analítica interactiva y gráficos de progreso. |
| **API Backend** | FastAPI (Python) | Alto rendimiento asíncrono, generación automática de documentación OpenAPI y tipado fuerte. |
| **ORM & Migraciones** | SQLAlchemy 2.0 / SQLModel + Alembic | Manejo estructurado de relaciones y control de versiones del esquema. |
| **Base de Datos** | PostgreSQL 16+ | Robusto, soporte transaccional completo, tipos JSONB y funciones avanzadas de series temporales. |
| **Red & Túnel** | Cloudflare Tunnel o Tailscale | Conectividad cifrada sin comprometer la seguridad de la red doméstica. |
| **Contenedores** | Docker & Docker Compose | Facilidad de despliegue, aislamiento de procesos y reproducibilidad en el homelab. |