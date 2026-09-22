# 📚 Documentación del Sistema - Skill Tracker Central

Bienvenido a la documentación oficial y modular de **Skill Tracker Central**. Esta carpeta contiene la especificación detallada de cada componente del sistema, separada por áreas de responsabilidad técnica para facilitar su mantenimiento y consulta.

---

## 🗂️ Contenido de la Documentación

| Documento | Descripción |
| :--- | :--- |
| **[01. Arquitectura y Stack](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/01-arquitectura-sistema.md)** | Visión general del sistema, roles de cada servicio (Frontend, Backend, PostgreSQL, Backup Daemon), diagrama de red, puertos y enrutamiento con Traefik. |
| **[02. Despliegue y Operaciones](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/02-despliegue-y-operaciones.md)** | Configuración de variables de entorno (`.env`), arranque con Docker Compose, migraciones de base de datos con Alembic, respaldos automáticos y ejecución de pruebas con Pytest. |
| **[03. Referencia de Endpoints API](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/03-api-endpoints.md)** | Catálogo completo de endpoints REST (`/api/v1/*`): autenticación JWT, gestión de habilidades, categorías, sesiones de práctica, hitos y tareas, analítica y sincronización. |
| **[04. Guía de Integración App Móvil (Android)](file:///c:/Users/kevin/Desktop/proyectos/skill-tracker-online/doc/04-guia-app-movil-android.md)** | **Guía clave para desarrolladores móviles**: Configuración de red (emulador vs físico vs homelab), permisos Android, flujo de usuario paso a paso, persistencia Room (SQLite), y protocolo de sincronización *offline-first* con resolución *Last-Write-Wins*. |

---

## 🔗 Enlaces Rápidos
- **Repositorio Base:** [README Principal](../README.md)
- **Documentación OpenAPI interactiva:** `http://localhost:8000/docs` (Swagger UI al tener el backend en ejecución)
- **Panel Web SPA:** `http://localhost:3000`
