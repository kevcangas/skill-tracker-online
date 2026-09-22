# 📱 04. Guía de Integración para App Móvil (Android)

Esta guía describe la arquitectura, configuración y el flujo paso a paso que la aplicación nativa de **Android (Kotlin + Room + Retrofit + WorkManager)** debe implementar para operar en modo **Offline-First** y sincronizarse con **Skill Tracker Central**.

---

## 💡 1. Principio Fundamental: Offline-First

1. **La base de datos local SQLite (Room) es la fuente inmediata de verdad para la interfaz de usuario.** La app nunca debe bloquear la pantalla ni esperar una respuesta HTTP para crear, editar o eliminar registros.
2. **PostgreSQL es el nodo central de conciliación.** Se encarga de centralizar datos, respaldar la información y sincronizar entre dispositivos y el panel Web de escritorio.
3. **Uso estricto de UUIDv4 generado en el cliente:** Tanto Android como el Backend emplean strings de 36 caracteres (`UUID.randomUUID().toString()`) como claves primarias (`id`). Jamás se deben usar IDs autoincrementales numéricos (`1, 2, 3...`) para evitar colisiones entre dispositivos.
4. **Soft Deletes (Borrado lógico):** Los registros nunca se eliminan físicamente de Room con `DELETE FROM`. Se marca `is_deleted = true`, se actualiza `updated_at` y se marca el registro para sincronización.

---

## ⚙️ 2. Configuración de Red y Seguridad en Android

### A. Permisos en `AndroidManifest.xml`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permisos de conectividad -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        ...
        android:networkSecurityConfig="@xml/network_security_config">
        ...
    </application>
</manifest>
```

### B. Permitir HTTP en Desarrollo Local (`res/xml/network_security_config.xml`)
Android bloquea de forma predeterminada el tráfico HTTP no cifrado (*cleartext*). Para pruebas en desarrollo local contra tu PC o emulador, crea este archivo:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Permitir HTTP para desarrollo local (Emulador e IPs privadas) -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.100</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

### C. URLs Base según el Entorno
Configura la URL base en tu clase de configuración o `build.gradle.kts`:

| Entorno | URL Base | Detalle |
| :--- | :--- | :--- |
| **Emulador Android Studio** | `http://10.0.2.2:8000/api/v1/` | `10.0.2.2` es el alias que el emulador Android usa para comunicarse con el `localhost` del ordenador anfitrión. |
| **Dispositivo Físico (Wi-Fi)** | `http://<IP_LOCAL_DE_TU_PC>:8000/api/v1/` | Ejemplo: `http://192.168.1.50:8000/api/v1/`. El teléfono y la PC deben estar en la misma red Wi-Fi. |
| **Producción / Homelab** | `https://skilltracker.tu-homelab.net/api/v1/` | Conexión segura HTTPS con certificado TLS (Traefik o Cloudflare Tunnel). |

---

## 👤 3. Flujo del Usuario y Ciclo de Vida en la App

A continuación se detalla la secuencia de interacción desde la perspectiva del usuario y cómo responde la arquitectura interna:

```text
[ Usuario ]                  [ App Android (Room) ]              [ Backend FastAPI ]
     │                                │                                   │
     ├── 1. Inicia sesión ───────────►│ Solicita /api/v1/auth/token ─────►│
     │   (Email / Password)           │◄──── Devuelve JWT Bearer ─────────┤
     │                                │ Guarda Token en DataStore         │
     │                                │                                   │
     ├── 2. Primer uso ──────────────►│ Dispara Sync Batch inicial ──────►│ (since = null)
     │   (Pantalla principal)         │◄──── Descarga todo el universo ───┤
     │                                │ Guarda en Room (categorías, etc.) │
     │                                │                                   │
     ├── 3. Crea Habilidad / Tarea ──►│ Guarda localmente en Room         │ (Sin conexión o
     │   (Offline o Online)           │ (ID: UUIDv4, sync_status: DIRTY)  │  con conexión)
     │                                │ La UI se actualiza de inmediato   │
     │                                │                                   │
     ├── 4. Segundo plano / Wi-Fi ───►│ WorkManager detecta red           │
     │   (Transparente al usuario)    │ Ejecuta POST /api/v1/sync/batch ─►│ (Push locales +
     │                                │                                   │  Pull novedades)
     │                                │ Actualiza sync_status a SYNCED    │
     │                                │ Persiste nuevo server_time        │
     │                                │                                   │
     ├── 5. Consulta Tareas ─────────►│ Lee de Room (type == 'task')      │
     │   (Filtro de usuario)          │ Renderiza tareas pendientes       │
```

---

### Paso 1: Autenticación, Registro e Identidad

La aplicación móvil soporta tanto el **registro de nuevas cuentas** como el **inicio de sesión** de cuentas existentes:

#### A. Registro de Nuevo Usuario (`POST /api/v1/auth/register`)
Si el usuario no tiene cuenta, la app móvil muestra la pantalla de Registro y envía:
- **Ruta:** `POST /api/v1/auth/register`
- **Headers:** `Content-Type: application/json`
- **Cuerpo (JSON):**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "miPasswordSeguro123",
    "full_name": "Nombre de Usuario"
  }
  ```
- **Respuesta (`201 Created`):**
  ```json
  {
    "id": "7020ff41-c799-4e56-9249-e98d44c8ee7b",
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre de Usuario"
  }
  ```
  *(La contraseña se encripta inmediatamente con `bcrypt` en el servidor y nunca se expone en texto plano).*

#### B. Inicio de Sesión (`POST /api/v1/auth/token`)
Inmediatamente tras registrarse (o si el usuario ya tenía cuenta previa):
1. La app envía un `POST /api/v1/auth/token` mediante `FormUrlEncoded` (`username` = email y `password`).
2. El backend valida las credenciales y devuelve el JWT Bearer:
   ```json
   {
     "access_token": "eyJhbGciOi...",
     "token_type": "bearer"
   }
   ```
3. La app consulta `GET /api/v1/auth/me` para obtener el `id` único del usuario autenticado.
4. Se guardan el `access_token` y el `user_id` de forma cifrada usando **Jetpack Security** (`EncryptedSharedPreferences`) o **Jetpack DataStore**.
5. En todas las peticiones posteriores, un interceptor de OkHttp inyecta automáticamente la cabecera:
   `Authorization: Bearer <access_token>`

> [!TIP]
> **Modo Sin Contraseña / Auto-Login (Opcional):** Si la app está destinada a uso personal o familiar en tu Homelab y no deseas que el usuario deba escribir contraseñas, la app móvil puede registrar o loguear silenciosamente en segundo plano un usuario predeterminado fijo (ejemplo: `demo@example.com` / `password123`). De este modo, la app entra directo a la pantalla principal sin formularios de acceso.

---

### Paso 2: Descarga Inicial (Initial Pull)
1. Inmediatamente tras el inicio de sesión, la app ejecuta una sincronización con `since = null`:
   `POST /api/v1/sync/batch?since=` con un payload vacío:
   ```json
   { "categories": [], "skills": [], "logs": [], "milestones": [] }
   ```
2. El servidor devuelve todas las categorías por defecto, habilidades, sesiones y tareas del usuario.
3. La app realiza un guardado masivo en SQLite (Room) dentro de una transacción (`@Transaction`).
4. Se guarda en DataStore la marca de tiempo devuelta por el servidor: `last_sync_timestamp = response.server_time`.

---

### Paso 3: Operaciones Diarias Offline
Cuando el usuario interactúa con la aplicación:
- **Crear Habilidad:**
  - `id = UUID.randomUUID().toString()`
  - `user_id = currentUserId`
  - `name = "Aprender Rust"`
  - `is_archived = false`
  - `created_at = Instant.now().toString()`
  - `updated_at = Instant.now().toString()`
  - `is_deleted = false`
  - `sync_status = "DIRTY"` (pendiente de subir)
- **Registrar Sesión de Práctica (Log):**
  - Genera `id` UUIDv4, vincula `skill_id`, añade `duration_minutes` y `notes`.
  - Guarda en Room con `sync_status = "DIRTY"`.
- **Crear o Completar Tareas:**
  - Guarda en la tabla `milestones` con `type = "task"`, `priority = "Alta"|"Media"|"Baja"`.
  - Al completar la tarea, la app ejecuta:
    `task.is_completed = true`
    `task.updated_at = Instant.now().toString()`
    `task.sync_status = "DIRTY"`
- **Eliminar Registro (Soft Delete):**
  - Jamás llamar `DELETE FROM`. Se actualiza el registro existente:
    `record.is_deleted = true`
    `record.updated_at = Instant.now().toString()`
    `record.sync_status = "DIRTY"`

---

### Paso 4: Sincronización en Segundo Plano con WorkManager
La sincronización debe operar de manera autónoma sin requerir intervención del usuario:

1. **Configurar el Worker Periódico:**
   ```kotlin
   val syncConstraints = Constraints.Builder()
       .setRequiredNetworkType(NetworkType.CONNECTED)
       .build()

   val syncWorkRequest = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
       .setConstraints(syncConstraints)
       .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
       .build()

   WorkManager.getInstance(context).enqueueUniquePeriodicWork(
       "SkillTrackerSync",
       ExistingPeriodicWorkPolicy.KEEP,
       syncWorkRequest
   )
   ```

2. **Lógica de Ejecución en `SyncWorker.doWork()`:**
   - **Paso A (Recolectar 'DIRTY'):** Consulta en Room todos los registros con `sync_status == "DIRTY"` en las 4 tablas (`categories`, `skills`, `logs`, `milestones`).
   - **Paso B (Ejecutar Batch):** Envía el payload a `POST /api/v1/sync/batch?since={last_sync_timestamp}`.
   - **Paso C (Procesar Respuesta):**
     - Para los registros locales que se enviaron con éxito, actualiza su `sync_status = "SYNCED"`.
     - Para los registros recibidos del servidor en la respuesta: los inserta o actualiza en Room con `OnConflictStrategy.REPLACE` y `sync_status = "SYNCED"`.
     - Guarda el nuevo `last_sync_timestamp = response.server_time`.

---

## 🗃️ 4. Modelos de Entidad Room en Kotlin (Ejemplo)

### Entidad de Habilidades (`SkillEntity.kt`)
```kotlin
@Entity(
    tableName = "skills",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["category_id"]),
        Index(value = ["updated_at"])
    ]
)
data class SkillEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val category_id: String?,
    val name: String,
    val description: String?,
    val is_archived: Boolean = false,
    val target_hours: Double = 100.0,
    val current_level: String = "Beginner",
    val created_at: String,       // Formato ISO-8601 UTC
    val updated_at: String,       // Formato ISO-8601 UTC
    val is_deleted: Boolean = false,
    val sync_status: String = "DIRTY" // "DIRTY" o "SYNCED"
)
```

### Entidad de Tareas e Hitos (`MilestoneEntity.kt`)
```kotlin
@Entity(
    tableName = "milestones",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["skill_id"]),
        Index(value = ["type"])
    ]
)
data class MilestoneEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val skill_id: String,
    val title: String,
    val type: String = "task",       // "task" (Tarea) o "milestone" (Hito)
    val priority: String = "Media",  // "Alta", "Media", "Baja"
    val is_completed: Boolean = false,
    val due_date: String? = null,    // Formato ISO-8601 UTC
    val achieved_at: String,         // Formato ISO-8601 UTC
    val created_at: String,
    val updated_at: String,
    val is_deleted: Boolean = false,
    val sync_status: String = "DIRTY"
)
```

---

## 🔍 5. ¿Cómo saber qué tareas pertenecen a qué usuario en Android?

1. **Al consultar en Room (DAO local):**
   ```kotlin
   @Dao
   interface TaskDao {
       // Obtiene todas las tareas activas del usuario autenticado
       @Query("""
           SELECT * FROM milestones 
           WHERE user_id = :userId 
             AND type = 'task' 
             AND is_deleted = 0 
           ORDER BY is_completed ASC, due_date ASC, created_at DESC
       """)
       fun getTasksForUser(userId: String): Flow<List<MilestoneEntity>>

       // Obtiene tareas asociadas a una habilidad en específico
       @Query("""
           SELECT * FROM milestones 
           WHERE user_id = :userId 
             AND skill_id = :skillId 
             AND type = 'task' 
             AND is_deleted = 0
       """)
       fun getTasksForSkill(userId: String, skillId: String): Flow<List<MilestoneEntity>>
   }
   ```

2. **Garantía en el Backend:**
   Cuando la app hace peticiones a `/api/v1/milestones` o `/api/v1/sync/batch`, el backend extrae automáticamente el `user_id` del token JWT. Es imposible que un usuario reciba tareas pertenecientes a otra cuenta.

---

## ⚖️ 6. Resolución de Conflictos: Last-Write-Wins (LWW)

Tanto el backend como la app móvil aplican la regla estricta de **última escritura gana**:

$$\text{Si } \text{updated\_at}_{\text{cliente}} > \text{updated\_at}_{\text{servidor}} \implies \text{El cambio del cliente sobreescribe el servidor}$$

$$\text{Si } \text{updated\_at}_{\text{servidor}} \ge \text{updated\_at}_{\text{cliente}} \implies \text{El cambio del servidor sobreescribe el cliente}$$

> [!IMPORTANT]
> **Regla de oro de los timestamps:** Absolutamente todas las marcas de tiempo (`created_at`, `updated_at`, `achieved_at`, `due_date`) deben generarse en **formato UTC estándar ISO-8601** (ejemplo: `2026-09-22T13:45:00.000Z`). Nunca guardes la hora local con offset en la base de datos; la conversión a hora local solo debe hacerse al pintar la fecha en la UI del dispositivo.

---

## ✅ 7. Checklist de Implementación para el Desarrollador Móvil

- [ ] Generador de IDs en el cliente configurado con `UUID.randomUUID().toString()`.
- [ ] Atributos `is_deleted` y `updated_at` presentes en todas las tablas de Room.
- [ ] Base URL configurable dinámicamente (`10.0.2.2` en emulador vs IP local en Wi-Fi).
- [ ] Almacenamiento seguro del Bearer Token en Jetpack Security / DataStore.
- [ ] Interceptor de Retrofit que añade `Authorization: Bearer <token>` en cada request.
- [ ] Tareas modeladas en la tabla `milestones` con `type = "task"`, `priority`, `is_completed` y `due_date`.
- [ ] Sincronización en segundo plano con `WorkManager` mediante `POST /api/v1/sync/batch`.
- [ ] Gestión adecuada de borrados mediante *Soft Delete* (`is_deleted = true`).
