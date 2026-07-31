# Documentación Técnica — SGA/WMS

Versión: 1.0 · Fecha: julio 2026

---

## 1. Visión general

El **Sistema de Gestión de Almacenes (SGA)** es una aplicación web full-stack multi-tenant que digitaliza y controla la operativa logística de almacenes. Permite configurar la topología física del almacén, gestionar el catálogo de artículos, controlar el stock en tiempo real y visualizar el almacén en 3D.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend | NestJS (Node.js) + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (access + refresh token) |
| 3D | Three.js + React Three Fiber |
| Servidor de app | Phusion Passenger (Plesk) |
| Servidor web | Apache |

### URLs de producción

| Servicio | URL |
|---|---|
| Frontend | `https://sga.iaragon.com` |
| API REST | `https://api-sga.iaragon.com/api/v1` |
| Swagger / Docs | `https://api-sga.iaragon.com/api/docs` |

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  React SPA (sga.iaragon.com)                            │
│  · Zustand (auth store)                                 │
│  · Axios (JWT Bearer + refresh automático)              │
│  · React Three Fiber (visor 3D)                         │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS + CORS
┌──────────────────────────▼──────────────────────────────┐
│  Apache + Phusion Passenger                             │
│  NestJS API (api-sga.iaragon.com)                       │
│  · Prefijo global: /api/v1                              │
│  · Guards globales: JwtAuthGuard + PermissionsGuard     │
│  · ValidationPipe global                                │
│  · ResponseInterceptor (respuesta unificada)            │
│  · HttpExceptionFilter                                  │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────┐
│  PostgreSQL                                             │
│  Base de datos: sga_db                                  │
│  Host: 127.0.0.1:5432                                   │
└─────────────────────────────────────────────────────────┘
```

### Multi-tenant

Cada empresa (`Company`) tiene sus propios usuarios, roles, almacenes y artículos completamente aislados. Todos los modelos de dominio incluyen `companyId`. Las consultas del backend filtran siempre por el `companyId` extraído del JWT del usuario autenticado.

---

## 3. Estructura de directorios

```
SGA/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos de base de datos
│   │   ├── seed.ts              # Datos iniciales (empresa demo + admin)
│   │   └── import-carb.ts       # Script de importación adicional
│   ├── src/
│   │   ├── main.ts              # Bootstrap NestJS, CORS, Swagger
│   │   ├── app.module.ts        # Módulo raíz, guards globales
│   │   ├── auth/                # Login, refresh, JWT strategy
│   │   ├── companies/           # CRUD empresas
│   │   ├── roles/               # CRUD roles + permisos
│   │   ├── users/               # CRUD usuarios
│   │   ├── warehouses/          # CRUD almacenes
│   │   ├── topology/            # Zona → Pasillo → Rack → Nivel → Ubicación
│   │   ├── items/               # Catálogo de artículos
│   │   ├── stock/               # Consulta y ajuste de inventario
│   │   ├── handling-units/      # Contenedores/LPN
│   │   ├── serial-numbers/      # Números de serie
│   │   ├── prisma/              # PrismaService (singleton)
│   │   └── common/              # Guards, decoradores, enums, filtros
│   ├── .env                     # Variables de entorno (no en git)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router principal
│   │   ├── api/
│   │   │   ├── client.ts        # Axios con interceptores JWT
│   │   │   ├── types.ts         # Tipos de respuesta API
│   │   │   └── topology-tree.types.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Shell: sidebar + outlet
│   │   │   └── viewer3d/        # Componentes Three.js
│   │   ├── pages/               # 9 páginas
│   │   ├── router/
│   │   │   └── ProtectedRoute.tsx
│   │   └── store/
│   │       └── auth.store.ts    # Zustand auth store
│   ├── public/
│   │   └── .htaccess            # SPA routing (Apache)
│   ├── .env.production          # VITE_API_URL producción
│   └── vite.config.ts           # Proxy /api en dev
└── docs/
    ├── SGA_Functional_Description.md
    ├── SGA_Prompt.md
    ├── Plesk_Deployment.md
    ├── Technical_Documentation.md  (este archivo)
    └── User_Manual.md
```

---

## 4. Base de datos — Modelos Prisma

### 4.1 Autenticación y usuarios

```
Company            User               Role
──────────         ──────             ──────
id (cuid)          id (cuid)          id (cuid)
name               companyId (FK)     companyId? (FK)
taxId (unique)     email              name
address?           passwordHash       isSystem
logoUrl?           name               createdAt / updatedAt
status             status
createdAt/updatedAt roleId (FK)        RolePermission
deletedAt?         createdAt/updatedAt ──────────────
                   deletedAt?         roleId (FK)
                                      permissionId (FK)

Permission
──────────
id
code (unique)
description?
```

### 4.2 Topología de almacén

```
Warehouse → Zone → Aisle → Rack → Level → Location
```

| Modelo | Campos clave |
|---|---|
| **Warehouse** | `code`, `name`, `address?`, `manager?`, `lengthM/widthM/heightM?`, `status` |
| **Zone** | `code`, `name`, `type` (NORMAL/CONTROLLED_TEMPERATURE/HAZARDOUS/QUARANTINE/SHIPPING/RECEIVING), `minTemp/maxTemp?`, `minHumidity/maxHumidity?` |
| **Aisle** | `code`, `axis` (X/Y), `startX/Y?`, `lengthM/widthM?`, `hasLeftRacks`, `hasRightRacks` |
| **Rack** | `code`, `type` (CONVENTIONAL/DRIVE_IN/CANTILEVER/MEZZANINE), `side` (LEFT/RIGHT), `columns`, `levelsCount`, `maxLoadKg?` |
| **Level** | `levelNumber`, `heightFromFloorM?`, `clearHeightM?`, `maxLoadKg?` |
| **Location** | `code`, dimensiones max, `status` (AVAILABLE/OCCUPIED/BLOCKED/RESERVED), `type` (STANDARD/BULK/STAGING), `multiSku`, `coordX/Y/Z?` |

### 4.3 Inventario

| Modelo | Campos clave |
|---|---|
| **Item** | `sku`, `ean?`, `name`, familia/marca, dimensiones, `baseUnit`, `stackable`, `hazardous`, `lotControlled`, `expiryControlled`, `serialControlled`, `pickingPolicy` (FIFO/FEFO/LIFO) |
| **Lot** | `lotNumber`, `manufactureDate?`, `expiryDate?`, `status` |
| **HandlingUnit** | `code`, `type` (PALLET/BOX/CONTAINER/OTHER), `status`, `locationId?` |
| **Stock** | `handlingUnitId`, `itemId`, `lotId?`, `serialNumberId?`, `quantity`, `reservedQty`, `blockedQty`, `quarantineQty` |
| **SerialNumber** | `serialNumber`, `status` (IN_STOCK/SHIPPED/RETURNED/SCRAPPED) |

---

## 5. API REST — Endpoints

Prefijo global: `/api/v1`  
Autenticación: `Authorization: Bearer <accessToken>` (salvo rutas `@Public()`)

### 5.1 Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Pública | Login. Body: `{ email, password }`. Devuelve `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | Pública | Renueva tokens. Body: `{ refreshToken }` |

### 5.2 Empresas

Permiso requerido: `company.manage`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/companies` | Crear empresa |
| GET | `/companies` | Listar (paginado) |
| GET | `/companies/:id` | Detalle |
| PATCH | `/companies/:id` | Actualizar |
| PATCH | `/companies/:id/activate` | Activar |
| PATCH | `/companies/:id/deactivate` | Desactivar |

### 5.3 Roles

Permiso requerido: `role.manage`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/roles` | Crear rol |
| GET | `/roles` | Listar roles de la empresa |
| GET | `/roles/:id` | Detalle con permisos asignados |
| PATCH | `/roles/:id` | Actualizar nombre y/o permisos |

### 5.4 Usuarios

Permiso requerido: `user.manage`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users` | Crear usuario |
| GET | `/users` | Listar (paginado) |
| GET | `/users/:id` | Detalle |
| PATCH | `/users/:id` | Actualizar |
| DELETE | `/users/:id` | Soft-delete |

### 5.5 Almacenes

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/warehouses` | `warehouse.create` | Crear almacén |
| GET | `/warehouses` | `warehouse.read` | Listar |
| GET | `/warehouses/:id` | `warehouse.read` | Detalle |
| PATCH | `/warehouses/:id` | `warehouse.update` | Actualizar |
| DELETE | `/warehouses/:id` | `warehouse.delete` | Soft-delete |

### 5.6 Topología

Base: `/warehouses/:warehouseId`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `.../topology-tree` | `warehouse.read` | Árbol completo |
| POST | `.../zones` | `warehouse.update` | Crear zona |
| GET | `.../zones` | `warehouse.read` | Listar zonas |
| GET | `.../zones/:zoneId` | `warehouse.read` | Detalle zona |
| PATCH | `.../zones/:zoneId` | `warehouse.update` | Actualizar zona |
| POST | `.../zones/:zoneId/aisles` | `warehouse.update` | Crear pasillo |
| GET | `.../zones/:zoneId/aisles` | `warehouse.read` | Listar pasillos |
| PATCH | `.../zones/:zoneId/aisles/:aisleId` | `warehouse.update` | Actualizar pasillo |
| POST | `.../aisles/:aisleId/racks` | `warehouse.update` | Crear rack |
| GET | `.../aisles/:aisleId/racks` | `warehouse.read` | Listar racks |
| PATCH | `.../racks/:rackId` | `warehouse.update` | Actualizar rack |
| POST | `.../racks/:rackId/levels` | `warehouse.update` | Crear nivel |
| GET | `.../racks/:rackId/levels` | `warehouse.read` | Listar niveles |
| PATCH | `.../levels/:levelId` | `warehouse.update` | Actualizar nivel |
| POST | `.../levels/:levelId/locations` | `warehouse.update` | Crear ubicación |
| GET | `.../levels/:levelId/locations` | `warehouse.read` | Listar ubicaciones |
| GET | `.../locations` | `warehouse.read` | Todas las ubicaciones |
| GET | `.../locations/:locationId` | `warehouse.read` | Detalle ubicación |
| PATCH | `.../locations/:locationId/block` | `warehouse.update` | Bloquear ubicación |
| PATCH | `.../locations/:locationId/unblock` | `warehouse.update` | Desbloquear |

### 5.7 Artículos

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/items` | `item.create` | Crear artículo |
| GET | `/items` | `item.read` | Listar (paginado, búsqueda) |
| GET | `/items/:id` | `item.read` | Detalle |
| PATCH | `/items/:id` | `item.update` | Actualizar |
| DELETE | `/items/:id` | `item.delete` | Soft-delete |

### 5.8 Stock

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/stock` | `inventory.read` | Consultar (filtros: `warehouseId`, `itemId`, `locationId`, `handlingUnitId`, `status`) |
| POST | `/stock/adjust` | `inventory.adjust` | Ajuste manual de cantidad |

### 5.9 Contenedores (Handling Units)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/handling-units` | `handling_unit.create` | Crear contenedor |
| GET | `/handling-units` | `handling_unit.read` | Listar |
| GET | `/handling-units/:id` | `handling_unit.read` | Detalle |
| PATCH | `/handling-units/:id` | `handling_unit.update` | Actualizar |
| PATCH | `/handling-units/:id/move` | `handling_unit.move` | Mover a otra ubicación |
| DELETE | `/handling-units/:id` | `handling_unit.update` | Soft-delete |

### 5.10 Números de serie

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/serial-numbers` | `serial_number.create` | Registrar |
| GET | `/serial-numbers` | `serial_number.read` | Listar |
| GET | `/serial-numbers/:id` | `serial_number.read` | Detalle |
| PATCH | `/serial-numbers/:id/status` | `serial_number.update` | Cambiar estado |
| PATCH | `/serial-numbers/:id/move` | `serial_number.move` | Mover a otro contenedor |

### Formato de respuesta unificado

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 6. Autenticación y autorización

### 6.1 Flujo JWT

```
1. POST /auth/login  →  { accessToken (15m), refreshToken (7d) }
2. Cada request      →  Authorization: Bearer <accessToken>
3. Si 401            →  POST /auth/refresh  →  nuevos tokens
4. Si refresh falla  →  logout (redirect /login)
```

### 6.2 Payload del JWT

```json
{
  "sub": "<userId>",
  "companyId": "<companyId>",
  "roleId": "<roleId>",
  "email": "usuario@empresa.com",
  "permissions": ["warehouse.read", "inventory.read", "..."]
}
```

### 6.3 Variables de entorno de autenticación

| Variable | Descripción | Default (dev) |
|---|---|---|
| `JWT_ACCESS_SECRET` | Clave firma access token | `dev-access-secret` |
| `JWT_ACCESS_EXPIRES_IN` | Expiración access token | `15m` |
| `JWT_REFRESH_SECRET` | Clave firma refresh token | `dev-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Expiración refresh token | `7d` |

> **Importante:** `.env.example` documenta `JWT_SECRET` y `JWT_EXPIRES_IN` pero el código usa `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`. En producción configurar las variables correctas.

### 6.4 Sistema de permisos (RBAC)

Los guards `JwtAuthGuard` y `PermissionsGuard` están registrados globalmente en `app.module.ts`.

- Todo endpoint requiere JWT, salvo `@Public()`
- Si el endpoint tiene `@RequirePermissions('permiso.codigo')`, el usuario debe tenerlo en su JWT
- Los permisos se cargan al hacer login y van embebidos en el token
- Si faltan permisos → `403 Permisos insuficientes`

---

## 7. Roles y permisos del sistema

### Roles predefinidos

| Rol | Descripción | isSystem |
|---|---|---|
| Administrador del sistema | Todos los permisos | ✓ |
| Responsable de almacén | Gestión operativa completa | ✓ |
| Operario | Solo ejecución de tareas | ✓ |
| Auditor/Gerencia | Solo lectura e informes | ✓ |

Los roles del sistema no se pueden eliminar ni modificar.

### Matriz de permisos por rol

| Permiso | Admin | Responsable | Operario | Auditor |
|---|:---:|:---:|:---:|:---:|
| `warehouse.read` | ✓ | ✓ | ✓ | ✓ |
| `warehouse.create` | ✓ | ✓ | | |
| `warehouse.update` | ✓ | ✓ | | |
| `warehouse.delete` | ✓ | | | |
| `inventory.read` | ✓ | ✓ | ✓ | ✓ |
| `inventory.adjust` | ✓ | ✓ | | |
| `movement.create` | ✓ | ✓ | ✓ | |
| `movement.cancel` | ✓ | ✓ | | |
| `order.create` | ✓ | ✓ | | |
| `order.update` | ✓ | ✓ | | |
| `order.cancel` | ✓ | ✓ | | |
| `task.assign` | ✓ | ✓ | | |
| `task.execute` | ✓ | | ✓ | |
| `report.export` | ✓ | ✓ | | ✓ |
| `audit.read` | ✓ | | | ✓ |
| `user.manage` | ✓ | | | |
| `item.read` | ✓ | ✓ | ✓ | ✓ |
| `item.create` | ✓ | ✓ | | |
| `item.update` | ✓ | ✓ | | |
| `item.delete` | ✓ | | | |
| `company.manage` | ✓ | | | |
| `role.manage` | ✓ | | | |
| `handling_unit.read` | ✓ | ✓ | ✓ | ✓ |
| `handling_unit.create` | ✓ | ✓ | | |
| `handling_unit.update` | ✓ | ✓ | | |
| `handling_unit.move` | ✓ | ✓ | ✓ | |
| `serial_number.read` | ✓ | ✓ | ✓ | ✓ |
| `serial_number.create` | ✓ | ✓ | | |
| `serial_number.update` | ✓ | ✓ | | |
| `serial_number.move` | ✓ | ✓ | ✓ | |
| `api_token.manage` | ✓ | | | |

---

## 8. Frontend

### 8.1 Rutas

| Ruta | Componente | Protegida | Descripción |
|---|---|:---:|---|
| `/login` | `Login.tsx` | No | Formulario de acceso |
| `/` | `Dashboard.tsx` | Sí | KPIs y resumen |
| `/warehouses` | `Warehouses.tsx` | Sí | Listado y gestión de almacenes |
| `/warehouses/:id` | `WarehouseDetail.tsx` | Sí | Topología jerárquica + stock |
| `/warehouses/:id/3d` | `WarehouseViewer3D.tsx` | Sí | Visor 3D interactivo |
| `/items` | `Items.tsx` | Sí | Catálogo de artículos |
| `/containers` | `Containers.tsx` | Sí | Contenedores/LPN |
| `/serial-numbers` | `SerialNumbers.tsx` | Sí | Números de serie |
| `/inventory` | `Inventory.tsx` | Sí | Consulta de stock |

### 8.2 Gestión de estado (Zustand)

```typescript
// store/auth.store.ts
interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  user: { email, companyId, roleId, permissions[] } | null
  setTokens(access, refresh): void
  logout(): void
  hasPermission(permission: string): boolean
}
```

Los tokens se persisten en `localStorage` (`sga_access_token`, `sga_refresh_token`).

### 8.3 Cliente API (Axios)

```typescript
// api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1'
})

// Request: añade Bearer token automáticamente
// Response 401: refresca tokens y reintenta la petición original
//              Si el refresh falla → logout
```

### 8.4 Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API. Producción: `https://api-sga.iaragon.com/api/v1` |

---

## 9. Variables de entorno del backend

Crear `/var/www/vhosts/iaragon.com/api-sga/backend/.env`:

```env
# Base de datos
DATABASE_URL="postgresql://sgasa:PASSWORD@127.0.0.1:5432/sga_db?schema=public"

# JWT (usar valores únicos y seguros en producción)
JWT_ACCESS_SECRET="clave-secreta-access-larga-y-aleatoria"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="clave-secreta-refresh-larga-y-aleatoria"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="https://sga.iaragon.com"

# Entorno
NODE_ENV="production"

# PORT no se define en producción (Passenger lo asigna)
```

---

## 10. Seed de datos iniciales

Ejecutar una sola vez tras el despliegue inicial:

```bash
cd /var/www/vhosts/iaragon.com/api-sga/backend
./node_modules/.bin/prisma db seed
```

Crea:
- Todos los permisos del catálogo
- Empresa demo: **Empresa Demo SGA** (CIF: B00000000)
- 4 roles del sistema con permisos configurados
- Usuario administrador: `admin@sga-demo.local` / `Admin123!`
- Almacén de ejemplo con topología completa (zonas, pasillos, racks, ubicaciones)
- 6 artículos de muestra
- Lotes, contenedores y stock distribuido

---

## 11. Despliegue

Ver `docs/Plesk_Deployment.md` para la guía completa.

### Despliegue backend (actualización)

```bash
# En el servidor vía SSH
cd /var/www/vhosts/iaragon.com/api-sga/backend
git pull
npm run build          # nest build → genera dist/
touch tmp/restart.txt  # reinicia Phusion Passenger
```

### Despliegue frontend (actualización)

```bash
# En local
cd frontend
npm run build          # genera dist/ con VITE_API_URL de .env.production

# Subir al servidor (Windows)
pscp -r dist/* root@212.227.159.27:/var/www/vhosts/iaragon.com/sga/frontend/
```

---

## 12. Notas técnicas relevantes

### CORS
El backend implementa un middleware Express que intercepta todas las peticiones `OPTIONS` antes de que lleguen a los guards de NestJS. Esto es necesario porque sin él, el `JwtAuthGuard` puede devolver 428 en el preflight si el browser incluye `Authorization` en `Access-Control-Request-Headers`.

```typescript
// main.ts — antes de enableCors()
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(204).send();
  next();
});
```

### Soft-delete
Las entidades principales (`User`, `Company`, `Warehouse`, `Item`, `HandlingUnit`) usan `deletedAt` para borrado lógico. Los registros borrados no aparecen en los listados pero permanecen en la base de datos.

### Respuesta unificada
Todos los endpoints devuelven `{ success, data, error, pagination? }` gracias a `ResponseInterceptor` y `HttpExceptionFilter`.

### Prisma vs. migraciones
El proyecto usa `prisma db push` en lugar de `prisma migrate`. No existe carpeta `migrations/`. Cualquier cambio de schema debe ejecutar `prisma db push` en producción.

### Dominio técnico Plesk
Los subdominios `.plesk.page` son "dominios técnicos" de Plesk — los navegadores interceptan las peticiones XHR con un aviso de cookie que impide el CORS. Siempre usar dominios reales en producción.
