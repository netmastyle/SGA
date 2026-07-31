# Manual de la API — SGA/WMS

**Base URL:** `https://api-sga.iaragon.com/api/v1`  
**Swagger interactivo:** `https://api-sga.iaragon.com/api/docs`  
**Versión:** 1.0 · Julio 2026

---

## Índice

1. [Introducción](#1-introducción)
2. [Autenticación](#2-autenticación)
3. [Formato de respuesta](#3-formato-de-respuesta)
4. [Paginación y filtros](#4-paginación-y-filtros)
5. [Códigos de error](#5-códigos-de-error)
6. [Endpoints — Auth](#6-endpoints--auth)
7. [Endpoints — Empresas](#7-endpoints--empresas)
8. [Endpoints — Roles](#8-endpoints--roles)
9. [Endpoints — Usuarios](#9-endpoints--usuarios)
10. [Endpoints — Almacenes](#10-endpoints--almacenes)
11. [Endpoints — Topología](#11-endpoints--topología)
12. [Endpoints — Artículos](#12-endpoints--artículos)
13. [Endpoints — Stock](#13-endpoints--stock)
14. [Endpoints — Contenedores](#14-endpoints--contenedores)
15. [Endpoints — Números de serie](#15-endpoints--números-de-serie)
16. [Permisos de acceso](#16-permisos-de-acceso)
17. [Ejemplos de integración](#17-ejemplos-de-integración)

---

## 1. Introducción

La API SGA/WMS es una API REST que permite gestionar de forma programática todos los recursos del sistema de almacén: almacenes, topología, artículos, stock, contenedores y números de serie.

### Convenciones

- Todos los endpoints usan el prefijo `/api/v1`
- Los cuerpos de petición y respuesta son JSON (`Content-Type: application/json`)
- Los IDs son strings CUID (ej. `clx1abc123...`)
- Las fechas siguen el formato ISO 8601: `2026-07-31T10:00:00.000Z`
- El sistema es **multi-tenant**: cada usuario solo ve y opera sobre los datos de su empresa (`companyId` extraído del JWT)

---

## 2. Autenticación

### Obtener tokens

Todas las peticiones (salvo login y refresh) requieren un **Bearer token** en la cabecera:

```
Authorization: Bearer <accessToken>
```

### Flujo de autenticación

```
1. POST /auth/login  →  accessToken (válido 15 min) + refreshToken (válido 7 días)
2. Usar accessToken en Authorization: Bearer <token>
3. Cuando el accessToken expire (401)  →  POST /auth/refresh con el refreshToken
4. Si el refreshToken también expira   →  volver al paso 1
```

### Almacenamiento recomendado

- `accessToken`: memoria o sessionStorage
- `refreshToken`: localStorage o cookie httpOnly

### Payload del JWT

El access token contiene:

```json
{
  "sub": "userId",
  "companyId": "companyId",
  "roleId": "roleId",
  "email": "usuario@empresa.com",
  "permissions": ["warehouse.read", "inventory.read", "..."],
  "iat": 1722420000,
  "exp": 1722420900
}
```

---

## 3. Formato de respuesta

### Respuesta exitosa

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Respuesta paginada

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 87,
      "totalPages": 5
    }
  },
  "error": null
}
```

### Respuesta de error

```json
{
  "success": false,
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Ya existe un artículo con ese SKU"
  }
}
```

---

## 4. Paginación y filtros

Los endpoints de listado aceptan los siguientes query params:

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | Número de página |
| `pageSize` | integer 1–200 | `20` | Elementos por página |
| `sortBy` | string | `createdAt` | Campo por el que ordenar |
| `sortDir` | `asc` \| `desc` | `asc` | Dirección del orden |
| `search` | string | — | Búsqueda de texto libre |

**Ejemplo:**
```
GET /api/v1/items?page=2&pageSize=10&search=tornillo&sortBy=name&sortDir=asc
```

---

## 5. Códigos de error

| Código HTTP | Significado | Causa habitual |
|---|---|---|
| `400 Bad Request` | Datos inválidos | Validación fallida, campo duplicado, operación no permitida |
| `401 Unauthorized` | Sin autenticar | Token ausente, expirado o inválido |
| `403 Forbidden` | Sin permisos | El rol del usuario no tiene el permiso requerido |
| `404 Not Found` | No encontrado | El recurso solicitado no existe o no pertenece a la empresa |
| `500 Internal Server Error` | Error del servidor | Error inesperado |

---

## 6. Endpoints — Auth

### POST `/auth/login`

Inicia sesión y obtiene tokens JWT.

**Sin autenticación requerida.**

**Request body:**
```json
{
  "email": "admin@sga-demo.local",
  "password": "Admin123!"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `email` | string | ✓ | Email del usuario |
| `password` | string (min. 6) | ✓ | Contraseña |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

**Errores posibles:**
- `401` — Credenciales inválidas o usuario inactivo

---

### POST `/auth/refresh`

Renueva los tokens usando el refresh token.

**Sin autenticación requerida.**

**Request body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 201:** igual que `/auth/login`

**Errores posibles:**
- `401` — Refresh token inválido o expirado

---

## 7. Endpoints — Empresas

> **Permiso requerido:** `company.manage`

### POST `/companies`

**Request body:**
```json
{
  "name": "Empresa Ejemplo S.L.",
  "taxId": "B12345678",
  "address": "Calle Mayor 1, Madrid",
  "logoUrl": "https://...",
  "status": "ACTIVE"
}
```

| Campo | Tipo | Obligatorio | Valores |
|---|---|:---:|---|
| `name` | string | ✓ | — |
| `taxId` | string | ✓ | Único en el sistema |
| `address` | string | | — |
| `logoUrl` | string (URL) | | — |
| `status` | string | | `ACTIVE` \| `INACTIVE` |

---

### GET `/companies`

Parámetros de paginación estándar.

---

### GET `/companies/:id`

---

### PATCH `/companies/:id`

Mismos campos que POST, todos opcionales.

---

### PATCH `/companies/:id/activate`

Sin body. Cambia el estado a `ACTIVE`.

---

### PATCH `/companies/:id/deactivate`

Sin body. Cambia el estado a `INACTIVE`.

---

## 8. Endpoints — Roles

> **Permiso requerido:** `role.manage`

### POST `/roles`

**Request body:**
```json
{
  "name": "Supervisor de turno",
  "permissionCodes": [
    "warehouse.read",
    "inventory.read",
    "inventory.adjust",
    "handling_unit.read",
    "handling_unit.move"
  ]
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `name` | string | ✓ | Nombre único dentro de la empresa |
| `permissionCodes` | string[] | | Lista de códigos de permiso del catálogo |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Supervisor de turno",
    "isSystem": false,
    "companyId": "clx...",
    "permissions": [
      { "permission": { "id": "...", "code": "warehouse.read", "description": null } }
    ]
  }
}
```

> Los roles con `isSystem: true` no pueden modificarse.

---

### GET `/roles`

Lista los roles de la empresa (propios + roles del sistema).

---

### GET `/roles/:id`

Incluye los permisos asignados.

---

### PATCH `/roles/:id`

```json
{
  "name": "Nuevo nombre",
  "permissionCodes": ["warehouse.read", "inventory.read"]
}
```

> `permissionCodes` **reemplaza** la lista completa de permisos (no es aditivo).

---

## 9. Endpoints — Usuarios

> **Permiso requerido:** `user.manage`

### POST `/users`

**Request body:**
```json
{
  "email": "operario1@empresa.com",
  "password": "Contrasena123!",
  "name": "Juan García",
  "roleId": "clx...",
  "status": "ACTIVE"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `email` | string | ✓ | Único dentro de la empresa |
| `password` | string (min. 8) | ✓ | Se almacena hasheada con bcrypt |
| `name` | string | ✓ | Nombre completo |
| `roleId` | string | ✓ | ID del rol a asignar |
| `status` | string | | `ACTIVE` \| `INACTIVE` |

---

### GET `/users`

Parámetros de paginación estándar.

---

### GET `/users/:id`

---

### PATCH `/users/:id`

Mismos campos que POST (todos opcionales). El campo `password` no está disponible en la actualización por este endpoint.

---

### DELETE `/users/:id`

Soft-delete. El usuario no puede hacer login pero sus datos se conservan.

**Response:**
```json
{
  "success": true,
  "data": { "deleted": true },
  "error": null
}
```

---

## 10. Endpoints — Almacenes

### POST `/warehouses`

> **Permiso:** `warehouse.create`

**Request body:**
```json
{
  "code": "ALM01",
  "name": "Almacén Central",
  "address": "Polígono Industrial Norte, Nave 3",
  "manager": "Pedro López",
  "description": "Almacén principal de producto terminado",
  "lengthM": 80.0,
  "widthM": 40.0,
  "heightM": 10.0,
  "status": "ACTIVE"
}
```

| Campo | Tipo | Obligatorio | Valores |
|---|---|:---:|---|
| `code` | string | ✓ | Único en la empresa |
| `name` | string | ✓ | — |
| `address` | string | | — |
| `manager` | string | | Responsable |
| `description` | string | | — |
| `lengthM` / `widthM` / `heightM` | number | | Dimensiones en metros |
| `status` | string | | `ACTIVE` \| `INACTIVE` \| `MAINTENANCE` |

---

### GET `/warehouses`

> **Permiso:** `warehouse.read`

Parámetros de paginación estándar.

---

### GET `/warehouses/:id`

> **Permiso:** `warehouse.read`

---

### PATCH `/warehouses/:id`

> **Permiso:** `warehouse.update`

---

### DELETE `/warehouses/:id`

> **Permiso:** `warehouse.delete`

Soft-delete. Solo si no tiene stock activo.

---

## 11. Endpoints — Topología

> Base: `/warehouses/:warehouseId`

### GET `.../topology-tree`

> **Permiso:** `warehouse.read`

Devuelve el árbol completo del almacén: zonas → pasillos → racks → niveles → ubicaciones.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "code": "ALM01",
    "zones": [
      {
        "id": "clx...",
        "code": "Z01",
        "name": "Zona General",
        "type": "NORMAL",
        "aisles": [
          {
            "id": "clx...",
            "code": "P01",
            "racks": [
              {
                "id": "clx...",
                "code": "R01",
                "levels": [
                  {
                    "id": "clx...",
                    "levelNumber": 1,
                    "locations": [ { "id": "clx...", "code": "A-01-1-01", "status": "AVAILABLE" } ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### POST `.../zones`

> **Permiso:** `warehouse.update`

```json
{
  "code": "Z01",
  "name": "Zona General",
  "type": "NORMAL",
  "minTemp": null,
  "maxTemp": null,
  "minHumidity": null,
  "maxHumidity": null,
  "restrictions": null
}
```

| Campo `type` | Descripción |
|---|---|
| `NORMAL` | Zona estándar |
| `CONTROLLED_TEMPERATURE` | Requiere rangos de temperatura |
| `HAZARDOUS` | Mercancía peligrosa |
| `QUARANTINE` | Artículos en espera de validación |
| `SHIPPING` | Zona de expedición |
| `RECEIVING` | Zona de recepción |

---

### GET `.../zones` / GET `.../zones/:zoneId`

> **Permiso:** `warehouse.read`

---

### PATCH `.../zones/:zoneId`

> **Permiso:** `warehouse.update`

---

### POST `.../zones/:zoneId/aisles`

> **Permiso:** `warehouse.update`

```json
{
  "code": "P01",
  "axis": "X",
  "startX": 5.0,
  "startY": 2.0,
  "lengthM": 20.0,
  "widthM": 3.0,
  "hasLeftRacks": true,
  "hasRightRacks": true
}
```

| Campo `axis` | Descripción |
|---|---|
| `X` | Pasillo orientado en el eje X |
| `Y` | Pasillo orientado en el eje Y |

---

### GET `.../zones/:zoneId/aisles`

> **Permiso:** `warehouse.read`

---

### PATCH `.../zones/:zoneId/aisles/:aisleId`

> **Permiso:** `warehouse.update`

---

### POST `.../aisles/:aisleId/racks`

> **Permiso:** `warehouse.update`

```json
{
  "code": "R01",
  "type": "CONVENTIONAL",
  "side": "LEFT",
  "offsetM": 0.0,
  "columns": 5,
  "levelsCount": 4,
  "moduleLengthM": 2.7,
  "moduleWidthM": 1.1,
  "moduleHeightM": 2.0,
  "maxLoadKg": 1000
}
```

| Campo `type` | Descripción |
|---|---|
| `CONVENTIONAL` | Estantería convencional |
| `DRIVE_IN` | Rack compacto de pasillo único |
| `CANTILEVER` | Voladizo (para piezas largas) |
| `MEZZANINE` | Altillo |

| Campo `side` | Descripción |
|---|---|
| `LEFT` | Lado izquierdo del pasillo |
| `RIGHT` | Lado derecho del pasillo |

---

### GET `.../aisles/:aisleId/racks` / PATCH `.../racks/:rackId`

> **Permiso:** `warehouse.read` / `warehouse.update`

---

### POST `.../racks/:rackId/levels`

> **Permiso:** `warehouse.update`

```json
{
  "levelNumber": 1,
  "heightFromFloorM": 0.0,
  "clearHeightM": 1.8,
  "maxLoadKg": 500
}
```

---

### GET `.../racks/:rackId/levels` / PATCH `.../levels/:levelId`

> **Permiso:** `warehouse.read` / `warehouse.update`

---

### POST `.../levels/:levelId/locations`

> **Permiso:** `warehouse.update`

```json
{
  "code": "P01-R01-N1-01",
  "maxLengthM": 2.7,
  "maxWidthM": 1.1,
  "maxHeightM": 1.8,
  "maxWeightKg": 500,
  "multiSku": false,
  "coordX": 0.0,
  "coordY": 0.0,
  "coordZ": 0.0
}
```

---

### GET `.../locations` — Todas las ubicaciones del almacén

> **Permiso:** `warehouse.read`

Query params adicionales: `status` (`AVAILABLE` \| `OCCUPIED` \| `BLOCKED` \| `RESERVED`)

---

### GET `.../locations/:locationId`

> **Permiso:** `warehouse.read`

---

### PATCH `.../locations/:locationId/block`

> **Permiso:** `warehouse.update`

```json
{
  "reason": "Reparación de estantería"
}
```

---

### PATCH `.../locations/:locationId/unblock`

> **Permiso:** `warehouse.update`

Sin body.

---

## 12. Endpoints — Artículos

### POST `/items`

> **Permiso:** `item.create`

**Request body:**
```json
{
  "sku": "ART-001",
  "name": "Tornillo M6x20 zinc",
  "ean": "8412345678901",
  "supplierCode": "PROV-TM620",
  "description": "Tornillo métrico M6 de 20mm, cabeza hexagonal, zincado",
  "family": "Ferretería",
  "subfamily": "Tornillería",
  "brand": "Würth",
  "lengthCm": 2.0,
  "widthCm": 0.6,
  "heightCm": 0.6,
  "weightKg": 0.005,
  "baseUnit": "UNIT",
  "stackable": true,
  "maxStack": 10,
  "hazardous": false,
  "adrClass": null,
  "lotControlled": true,
  "expiryControlled": false,
  "serialControlled": false,
  "pickingPolicy": "FIFO",
  "minStock": 100,
  "maxStock": 5000,
  "imageUrl": null
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `sku` | string | ✓ | Código único del artículo en la empresa |
| `name` | string | ✓ | Nombre descriptivo |
| `ean` | string | | Código de barras EAN |
| `supplierCode` | string | | Referencia del proveedor |
| `family` / `subfamily` / `brand` | string | | Clasificación |
| `lengthCm` / `widthCm` / `heightCm` | number | | Dimensiones en cm |
| `weightKg` | number | | Peso en kg |
| `baseUnit` | string | | Unidad base (ej. `UNIT`, `KG`, `LITER`) |
| `stackable` | boolean | | ¿Se puede apilar? |
| `maxStack` | integer | | Máximo de unidades apiladas |
| `hazardous` | boolean | | ¿Es mercancía peligrosa? |
| `adrClass` | string | | Clase ADR si `hazardous = true` |
| `lotControlled` | boolean | | Control por lote |
| `expiryControlled` | boolean | | Control de caducidad |
| `serialControlled` | boolean | | Control por número de serie individual |
| `pickingPolicy` | string | | `FIFO` \| `FEFO` \| `LIFO` |
| `minStock` / `maxStock` | number | | Niveles de alerta de stock |

> Si `serialControlled = true`, el stock de este artículo se gestiona únicamente mediante el endpoint `/serial-numbers`, no con `/stock/adjust`.

---

### GET `/items`

> **Permiso:** `item.read`

Query params: paginación estándar + `search` (busca en SKU y nombre).

---

### GET `/items/:id`

> **Permiso:** `item.read`

---

### PATCH `/items/:id`

> **Permiso:** `item.update`

Todos los campos son opcionales. El SKU no se puede modificar.

---

### DELETE `/items/:id`

> **Permiso:** `item.delete`

Soft-delete. **Falla** si el artículo tiene stock o movimientos registrados.

---

## 13. Endpoints — Stock

### GET `/stock`

> **Permiso:** `inventory.read`

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `warehouseId` | string | Filtrar por almacén |
| `itemId` | string | Filtrar por artículo |
| `locationId` | string | Filtrar por ubicación |
| `handlingUnitId` | string | Filtrar por contenedor |
| `status` | string | Estado de la ubicación: `AVAILABLE` \| `OCCUPIED` \| `BLOCKED` \| `RESERVED` |
| `search` | string | Busca en SKU, nombre, código LPN y código de ubicación |
| `page` / `pageSize` | integer | Paginación |

**Response data incluye:** item, lot, handlingUnit con su location.

---

### POST `/stock/adjust`

> **Permiso:** `inventory.adjust`

Ajusta la cantidad de un artículo en un contenedor. Usa `quantityDelta` positivo para entradas y negativo para salidas.

**Request body:**
```json
{
  "handlingUnitId": "clx...",
  "itemId": "clx...",
  "lotId": "clx...",
  "quantityDelta": 50,
  "reason": "Recepción de mercancía pedido PO-2026-001"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `handlingUnitId` | string | ✓ | ID del contenedor/LPN |
| `itemId` | string | ✓ | ID del artículo |
| `lotId` | string | | ID del lote (si el artículo tiene `lotControlled = true`) |
| `quantityDelta` | number | ✓ | Cantidad a añadir (positivo) o retirar (negativo) |
| `reason` | string | | Motivo del ajuste |

**Restricciones:**
- El contenedor debe existir y no estar en una ubicación bloqueada
- El artículo no puede ser de control por número de serie (usar `/serial-numbers`)
- El resultado no puede ser stock negativo

---

## 14. Endpoints — Contenedores

Los contenedores (Handling Units / LPN) son las unidades físicas que agrupan mercancía dentro del almacén: palés, cajas, contenedores, etc.

### POST `/handling-units`

> **Permiso:** `handling_unit.create`

**Request body:**
```json
{
  "code": "PAL-2026-001",
  "warehouseId": "clx...",
  "locationId": "clx...",
  "type": "PALLET",
  "weightKg": 0.0,
  "lengthCm": 120.0,
  "widthCm": 80.0,
  "heightCm": 15.0
}
```

| Campo | Tipo | Obligatorio | Valores |
|---|---|:---:|---|
| `code` | string | ✓ | Código LPN único en la empresa |
| `warehouseId` | string | ✓ | Almacén al que pertenece |
| `locationId` | string | | Ubicación inicial |
| `type` | string | | `PALLET` \| `BOX` \| `CONTAINER` \| `OTHER` |
| `weightKg` | number | | Peso tara |
| `lengthCm` / `widthCm` / `heightCm` | number | | Dimensiones |

---

### GET `/handling-units`

> **Permiso:** `handling_unit.read`

Paginación estándar + `search`.

---

### GET `/handling-units/:id`

> **Permiso:** `handling_unit.read`

---

### PATCH `/handling-units/:id`

> **Permiso:** `handling_unit.update`

```json
{
  "type": "BOX",
  "status": "IN_USE",
  "weightKg": 2.5,
  "lengthCm": 60.0,
  "widthCm": 40.0,
  "heightCm": 30.0
}
```

| Campo `status` | Descripción |
|---|---|
| `EMPTY` | Contenedor vacío |
| `IN_USE` | Con mercancía |
| `DAMAGED` | Dañado |
| `SCRAPPED` | Dado de baja |

---

### PATCH `/handling-units/:id/move`

> **Permiso:** `handling_unit.move`

Mueve el contenedor a una nueva ubicación.

```json
{
  "locationId": "clx...",
  "reason": "Reubicación por reorganización de almacén"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `locationId` | string | ✓ | Nueva ubicación de destino |
| `reason` | string | | Motivo del movimiento |

---

### DELETE `/handling-units/:id`

> **Permiso:** `handling_unit.update`

Soft-delete.

---

## 15. Endpoints — Números de serie

Seguimiento unitario de artículos con `serialControlled = true`.

### POST `/serial-numbers`

> **Permiso:** `serial_number.create`

**Request body:**
```json
{
  "itemId": "clx...",
  "serialNumber": "SN-2026-00001",
  "handlingUnitId": "clx..."
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `itemId` | string | ✓ | Artículo con `serialControlled = true` |
| `serialNumber` | string | ✓ | Número de serie único para ese artículo |
| `handlingUnitId` | string | | Contenedor donde se ubica |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "itemId": "clx...",
    "serialNumber": "SN-2026-00001",
    "status": "IN_STOCK",
    "handlingUnitId": "clx..."
  }
}
```

---

### GET `/serial-numbers`

> **Permiso:** `serial_number.read`

Paginación estándar + `search`.

---

### GET `/serial-numbers/:id`

> **Permiso:** `serial_number.read`

---

### PATCH `/serial-numbers/:id/status`

> **Permiso:** `serial_number.update`

```json
{
  "status": "SHIPPED"
}
```

| Valor `status` | Descripción |
|---|---|
| `IN_STOCK` | Disponible en almacén |
| `SHIPPED` | Expedido |
| `RETURNED` | Devuelto |
| `SCRAPPED` | Dado de baja |

---

### PATCH `/serial-numbers/:id/move`

> **Permiso:** `serial_number.move`

Mueve el número de serie a otro contenedor.

```json
{
  "handlingUnitId": "clx..."
}
```

---

## 16. Permisos de acceso

Catálogo completo de permisos:

| Código | Descripción |
|---|---|
| `warehouse.read` | Ver almacenes y su topología |
| `warehouse.create` | Crear almacenes |
| `warehouse.update` | Modificar almacenes y topología |
| `warehouse.delete` | Eliminar almacenes |
| `inventory.read` | Consultar stock |
| `inventory.adjust` | Ajustar cantidades de stock |
| `movement.create` | Crear movimientos de mercancía |
| `movement.cancel` | Cancelar movimientos |
| `order.create` | Crear órdenes de entrada/salida |
| `order.update` | Modificar órdenes |
| `order.cancel` | Cancelar órdenes |
| `task.assign` | Asignar tareas a operarios |
| `task.execute` | Ejecutar tareas asignadas |
| `report.export` | Exportar informes |
| `api_token.manage` | Gestionar tokens de API |
| `audit.read` | Ver registros de auditoría |
| `user.manage` | Gestionar usuarios |
| `item.read` | Ver catálogo de artículos |
| `item.create` | Crear artículos |
| `item.update` | Modificar artículos |
| `item.delete` | Eliminar artículos |
| `company.manage` | Gestionar empresas |
| `role.manage` | Gestionar roles y permisos |
| `handling_unit.read` | Ver contenedores |
| `handling_unit.create` | Crear contenedores |
| `handling_unit.update` | Modificar contenedores |
| `handling_unit.move` | Mover contenedores |
| `serial_number.read` | Ver números de serie |
| `serial_number.create` | Registrar números de serie |
| `serial_number.update` | Cambiar estado de número de serie |
| `serial_number.move` | Mover número de serie entre contenedores |

---

## 17. Ejemplos de integración

### Ejemplo completo: registrar una entrada de mercancía

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://api-sga.iaragon.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sga-demo.local","password":"Admin123!"}' \
  | jq -r '.data.accessToken')

# 2. Crear contenedor (palé)
curl -X POST https://api-sga.iaragon.com/api/v1/handling-units \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PAL-2026-999",
    "warehouseId": "<warehouseId>",
    "locationId": "<locationId>",
    "type": "PALLET"
  }'

# 3. Ajustar stock (añadir 200 unidades del artículo al palé)
curl -X POST https://api-sga.iaragon.com/api/v1/stock/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "handlingUnitId": "<handlingUnitId>",
    "itemId": "<itemId>",
    "quantityDelta": 200,
    "reason": "Recepción pedido PO-2026-001"
  }'
```

### Ejemplo: consultar stock de un almacén paginado

```bash
curl "https://api-sga.iaragon.com/api/v1/stock?warehouseId=<id>&page=1&pageSize=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Ejemplo: registrar un número de serie

```bash
curl -X POST https://api-sga.iaragon.com/api/v1/serial-numbers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "<itemId>",
    "serialNumber": "SN-2026-ABC123",
    "handlingUnitId": "<handlingUnitId>"
  }'
```

### Ejemplo JavaScript (fetch)

```javascript
const API = 'https://api-sga.iaragon.com/api/v1';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { data } = await res.json();
  return data; // { accessToken, refreshToken }
}

async function getStock(accessToken, warehouseId) {
  const res = await fetch(`${API}/stock?warehouseId=${warehouseId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const { data } = await res.json();
  return data; // { items: [...], pagination: {...} }
}
```
