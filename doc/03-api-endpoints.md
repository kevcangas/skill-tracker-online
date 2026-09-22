# 📡 03. Referencia de Endpoints API REST

Todos los endpoints están versionados bajo el prefijo `/api/v1` y devuelven respuestas estructuradas en formato JSON con soporte de códigos de estado HTTP estándar.

La documentación interactiva Swagger / OpenAPI está disponible en:
- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8000/redoc` (ReDoc)

---

## 🔐 Cabeceras Globales

Para cualquier endpoint que requiera autenticación, debe enviarse la cabecera:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 1. Autenticación (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registra una nueva cuenta de usuario en el sistema.
- **Request Body (JSON):**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "miPasswordSeguro123",
    "full_name": "Nombre de Usuario"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "id": "c1f7a0be-8e6d-495e-9907-2a4b8df2a101",
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre de Usuario",
    "created_at": "2026-09-22T13:00:00Z"
  }
  ```

---

### `POST /api/v1/auth/token`
Inicia sesión y genera un JWT Bearer Token (cumple con la especificación OAuth2 Password Flow).
- **Request Body (`application/x-www-form-urlencoded`):**
  - `username`: `usuario@ejemplo.com`
  - `password`: `miPasswordSeguro123`
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

---

### `GET /api/v1/auth/me`
Obtiene los datos del perfil del usuario actualmente autenticado.
- **Response `200 OK`:**
  ```json
  {
    "id": "c1f7a0be-8e6d-495e-9907-2a4b8df2a101",
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre de Usuario"
  }
  ```

---

## 2. Categorías (`/api/v1/categories`)

### `GET /api/v1/categories`
Obtiene las categorías activas del usuario. Si es la primera vez que consulta, inicializa automáticamente las categorías estándar (*Tecnología, Idiomas, Arte, Música, Deportes y Salud, General*).
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "f5c2e391-4d3e-4fa0-8647-794025f16382",
      "name": "Tecnología",
      "color": "#3B82F6",
      "icon": "code",
      "updated_at": "2026-09-22T13:00:00Z",
      "is_deleted": false
    }
  ]
  ```

### `POST /api/v1/categories`
Crea una nueva categoría personalizada.
- **Request Body (JSON):**
  ```json
  {
    "name": "Finanzas",
    "color": "#10B981",
    "icon": "dollar-sign"
  }
  ```

---

## 3. Habilidades (`/api/v1/skills`)

### `GET /api/v1/skills`
Lista todas las habilidades activas (`is_deleted = false`) del usuario autenticado.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "7020ff41-c799-4e56-9249-e98d44c8ee7b",
      "category_id": "f5c2e391-4d3e-4fa0-8647-794025f16382",
      "name": "Kotlin Android Development",
      "description": "Desarrollo móvil nativo con Room y Coroutines",
      "is_archived": false,
      "target_hours": 100.0,
      "current_level": "Intermediate",
      "updated_at": "2026-09-22T13:00:00Z",
      "is_deleted": false
    }
  ]
  ```

### `POST /api/v1/skills`
Registra una nueva habilidad.
- **Request Body (JSON):**
  ```json
  {
    "name": "Kotlin Android Development",
    "category_id": "f5c2e391-4d3e-4fa0-8647-794025f16382",
    "description": "Desarrollo móvil nativo con Room",
    "target_hours": 150.0,
    "current_level": "Beginner",
    "is_archived": false
  }
  ```

### `PUT /api/v1/skills/{skill_id}`
Actualiza atributos de una habilidad (nivel, horas objetivo, archivado o descripción).

### `DELETE /api/v1/skills/{skill_id}`
Realiza el borrado lógico (*Soft Delete*) marcando `is_deleted = true` y actualizando `updated_at`. Retorna `204 No Content`.

---

## 4. Sesiones de Práctica / Logs (`/api/v1/logs`)

### `GET /api/v1/logs`
Obtiene el historial de sesiones de práctica ordenadas cronológicamente descendente.
- **Query Params opcionales:** `skill_id` (filtrar por habilidad), `limit` (default: 100).
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "4a7f05c1-2fbb-4e92-944a-d6015b6d9e03",
      "skill_id": "7020ff41-c799-4e56-9249-e98d44c8ee7b",
      "duration_minutes": 45,
      "notes": "Configuración de WorkManager y llamadas Retrofit",
      "logged_at": "2026-09-22T11:30:00Z",
      "updated_at": "2026-09-22T11:30:00Z",
      "is_deleted": false
    }
  ]
  ```

### `POST /api/v1/logs`
Registra una sesión de práctica completada.
- **Request Body (JSON):**
  ```json
  {
    "skill_id": "7020ff41-c799-4e56-9249-e98d44c8ee7b",
    "duration_minutes": 45,
    "notes": "Configuración de WorkManager",
    "logged_at": "2026-09-22T11:30:00Z"
  }
  ```

---

## 5. Hitos y Tareas (`/api/v1/milestones`)

La entidad `Milestone` gestiona tanto **Hitos** como **Tareas** mediante el campo `type`:

| `type` | Significado | Comportamiento |
| :--- | :--- | :--- |
| `"task"` | **Tarea / Pendiente** | Tarea accionable con prioridad (`"Alta"`, `"Media"`, `"Baja"`), fecha límite (`due_date`) y estado de completitud (`is_completed`). |
| `"milestone"` | **Hito de Progreso** | Meta o logro alcanzado en una habilidad en una fecha específica (`achieved_at`). |

### `GET /api/v1/milestones`
Retorna todos los hitos y tareas no eliminados del usuario.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "6d91bb3a-9e0a-42a1-bd56-11f87920ab88",
      "skill_id": "7020ff41-c799-4e56-9249-e98d44c8ee7b",
      "title": "Implementar SyncWorker con Room",
      "type": "task",
      "priority": "Alta",
      "is_completed": false,
      "due_date": "2026-09-25T18:00:00Z",
      "achieved_at": "2026-09-22T13:00:00Z",
      "updated_at": "2026-09-22T13:00:00Z",
      "is_deleted": false
    }
  ]
  ```

### `POST /api/v1/milestones`
Crea una nueva tarea o hito.
- **Request Body (JSON):**
  ```json
  {
    "skill_id": "7020ff41-c799-4e56-9249-e98d44c8ee7b",
    "title": "Diseñar pantalla de login en Jetpack Compose",
    "type": "task",
    "priority": "Media",
    "is_completed": false,
    "due_date": "2026-09-30T23:59:59Z"
  }
  ```

### `PUT /api/v1/milestones/{ms_id}`
Actualiza atributos (por ejemplo, marcar `is_completed: true` al finalizar la tarea).

### `DELETE /api/v1/milestones/{ms_id}`
Borrado lógico (`is_deleted = true`).

---

## 6. Motor de Sincronización (`/api/v1/sync`)

Diseñado para sincronización masiva y atómica con clientes móviles offline.

### `POST /api/v1/sync/batch?since={ISO_TIMESTAMP}` *(Recomendado para Móvil)*
Ejecuta **Push** y **Pull** en un único viaje HTTP (Single Round-Trip):
1. Procesa y persiste las entidades locales enviadas en la carga útil.
2. Resuelve conflictos mediante *Last-Write-Wins (LWW)*.
3. Devuelve inmediatamente todos los cambios en el servidor ocurridos con posterioridad a la marca de tiempo `since`.

- **Request Body (JSON):**
  ```json
  {
    "categories": [],
    "skills": [],
    "logs": [],
    "milestones": []
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "server_time": "2026-09-22T13:40:00Z",
    "categories": [...],
    "skills": [...],
    "logs": [...],
    "milestones": [...]
  }
  ```

### `POST /api/v1/sync/push`
Envía entidades locales hacia PostgreSQL.
- **Response `200 OK`:**
  ```json
  {
    "processed_categories": 1,
    "processed_skills": 2,
    "processed_logs": 5,
    "processed_milestones": 3,
    "conflicts_resolved": 0,
    "server_time": "2026-09-22T13:40:00Z"
  }
  ```

### `GET /api/v1/sync/pull?since={ISO_TIMESTAMP}`
Obtiene todos los registros modificados o eliminados después de `since`. Si no se envía `since`, retorna todo el universo de datos del usuario.

---

## 7. Analítica y Estadísticas (`/api/v1/stats`)

### `GET /api/v1/stats/dashboard`
Retorna el paquete consolidado para dashboards y paneles analíticos:
- `total_hours`: Horas acumuladas globales.
- `total_skills`: Cantidad de habilidades activas.
- `heatmap`: Matriz de intensidad de los últimos 60 días (`{ date: "YYYY-MM-DD", minutes: 90, level: 3 }`).
- `categories`: Horas totales y porcentajes agrupados por categoría.
- `skills`: Lista enriquecida de habilidades con horas registradas, progreso porcentual y estado de archivado.
- `logs`: Últimas sesiones de práctica registradas.
- `milestones`: Lista de hitos logrados (`type == "milestone"`).
- `tasks`: Lista de tareas pendientes y completadas (`type == "task"`).
