# Sistema de Gestión de Almacenes (SGA) — Descripción Funcional Detallada

**Versión:** 1.0  
**Fecha:** 2026-06-25  
**Estado:** Borrador

---

## Tabla de Contenidos

1. [Introducción y Alcance](#1-introducción-y-alcance)
2. [Actores del Sistema](#2-actores-del-sistema)
3. [Gestión de la Topología del Almacén](#3-gestión-de-la-topología-del-almacén)
4. [Gestión del Catálogo de Artículos](#4-gestión-del-catálogo-de-artículos)
5. [Gestión de Inventario y Movimientos](#5-gestión-de-inventario-y-movimientos)
6. [Reglas de Negocio y Lógica de Ubicación](#6-reglas-de-negocio-y-lógica-de-ubicación)
7. [Entorno Web — Módulos del Frontend](#7-entorno-web--módulos-del-frontend)
8. [Visor Gráfico 3D](#8-visor-gráfico-3d)
9. [API REST — Integración con Terceros](#9-api-rest--integración-con-terceros)
10. [Seguridad y Autenticación](#10-seguridad-y-autenticación)
11. [Notificaciones y Alertas](#11-notificaciones-y-alertas)
12. [Reporting y Exportación](#12-reporting-y-exportación)
13. [Modelo de Datos (Esquema Conceptual)](#13-modelo-de-datos-esquema-conceptual)
14. [Pila Tecnológica Propuesta](#14-pila-tecnológica-propuesta)
15. [Glosario](#15-glosario)

---

## 1. Introducción y Alcance

El **Sistema de Gestión de Almacenes (SGA)** es una plataforma software destinada a optimizar, controlar y digitalizar la gestión de mercancía dentro de instalaciones logísticas empresariales. Provee al operador logístico de un modelo digital completo del almacén físico, con capacidad de:

- Configurar la estructura física del almacén (pasillos, estanterías, niveles, huecos).
- Controlar la ubicación exacta de cada artículo en tiempo real.
- Gestionar entradas, salidas y movimientos internos de mercancía.
- Visualizar gráficamente en 3D el estado del almacén, la ocupación de huecos y la localización de artículos.
- Integrarse con sistemas externos (ERP, e-commerce, proveedores de transporte) mediante una API REST segura.
- Generar informes, estadísticas y exportar datos para análisis.

El sistema es **multi-empresa** y **multi-almacén**, con aislamiento total de datos entre empresas distintas. Cada empresa puede tener múltiples almacenes, y cada almacén se gestiona de forma independiente.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Administrador del Sistema** | Gestiona empresas, usuarios, permisos globales y configuración del sistema. |
| **Responsable de Almacén** | Configura la topología del almacén, gestiona maestros de artículos y supervisa el inventario. |
| **Operario de Almacén** | Ejecuta operaciones diarias: entradas, salidas y movimientos de mercancía. |
| **Sistema Externo (API)** | ERP, e-commerce u otro sistema que interactúa con el SGA mediante la API REST. |
| **Auditor / Gerencia** | Consulta informes, estadísticas y trazabilidad sin poder modificar datos. |

---

## 3. Gestión de la Topología del Almacén

La topología define la estructura jerárquica física del almacén. El modelo es el siguiente:

```
Empresa
  └── Almacén (Warehouse)
        ├── Zona (Zone)
        │     └── Pasillo (Aisle)
        │           └── Estantería (Rack / Bay)
        │                 └── Nivel (Level / Altura)
        │                       └── Hueco (Location / Slot)
        └── Zona de expedición / recepción (Staging Area)
```

### 3.1 Empresa (Company)
- Nombre, CIF/NIF, dirección, logotipo.
- Aislamiento de datos total entre empresas.

### 3.2 Almacén (Warehouse)
- Nombre, código, dirección física, descripción, responsable.
- Dimensiones aproximadas del recinto (largo × ancho × alto en metros).
- Estado: Activo / Inactivo / En mantenimiento.
- Un almacén puede contener múltiples **zonas**.

### 3.3 Zona (Zone)
- Nombre y código de zona (ej. `ZONA-A`, `FRIO`, `PELIGROSO`).
- Tipo de zona: Normal, Temperatura controlada, Mercancía peligrosa, Cuarentena, Expedición, Recepción.
- Restricciones específicas de temperatura o humedad (rangos min/max).
- Una zona agrupa uno o varios **pasillos** físicamente contiguos.

### 3.4 Pasillo (Aisle)
- Código único dentro del almacén (ej. `A01`, `B02`).
- Dirección del pasillo (eje X o eje Y en el plano del almacén).
- Posición de inicio en el plano (coordenadas X, Y).
- Longitud del pasillo.
- Estanterías a la izquierda y/o derecha del pasillo.

### 3.5 Estantería / Bahía (Rack / Bay)
- Código único (ej. `A01-R01`).
- Número de módulos horizontales (columnas).
- Número de niveles (alturas).
- Dimensiones de cada módulo (ancho × profundidad en cm).
- Carga máxima por nivel (kg).
- Posición en el pasillo (lado izquierdo / derecho, offset desde el inicio del pasillo).
- Tipo: Estantería convencional, Drive-in, Cantilever, Mezzanine.

### 3.6 Nivel / Altura (Level)
- Número de nivel (1 = suelo, hacia arriba).
- Altura desde el suelo (cm).
- Altura libre del nivel (espacio libre de carga, cm).
- Carga máxima del nivel (kg).
- Los niveles se definen como patrón en la estantería o individualmente.

### 3.7 Hueco / Ubicación (Location / Slot)
- Código único en el sistema con formato normalizado: `[Almacén]-[Pasillo]-[Estantería]-[Nivel]-[Columna]`, ej. `ALM01-A01-R01-02-03`.
- Dimensiones máximas admisibles (largo × ancho × alto en cm).
- Peso máximo admisible (kg).
- Estado: `LIBRE`, `OCUPADO`, `PARCIAL`, `BLOQUEADO`, `RESERVADO`.
- Tipo de hueco: Normal, Picking, Bulto completo, Especial.
- Contenido: lista de artículos con sus cantidades (permite multi-artículo o single-SKU según configuración).
- Permite indicar si el hueco admite ubicación de múltiples referencias (multi-SKU) o solo una referencia a la vez.

---

## 4. Gestión del Catálogo de Artículos

### 4.1 Artículo (Item / SKU)
Cada artículo tiene los siguientes atributos:
- **Identificadores**: SKU (código de referencia interno), EAN/UPC (código de barras), código proveedor.
- **Descripción**: Nombre, descripción larga, familia, subfamilia, marca, proveedor.
- **Dimensiones**: Largo × Ancho × Alto (cm), Peso unitario (kg).
- **Unidades de medida**: Unidad base (ud, kg, litros), factor de conversión a unidad de compra/venta.
- **Apilabilidad**: ¿Se puede apilar? Número máximo de unidades apiladas.
- **Requerimientos especiales**: Temperatura controlada (rango min/max °C), mercancía peligrosa (clase ADR), frágil, caduca.
- **Caducidad**: Gestión de fecha de caducidad / lote (FIFO / FEFO / LIFO configurable por artículo).
- **Stock mínimo y máximo**: Alertas de ruptura de stock o sobrestock.
- **Imagen del artículo**.

### 4.2 Unidades de Embalaje
- Definición de múltiples unidades (unidad suelta, caja, palet, etc.).
- Dimensiones y peso por unidad de embalaje.
- Código EAN por unidad de embalaje.

### 4.3 Gestión de Lotes
- Número de lote, fecha de fabricación, fecha de caducidad.
- País de origen.
- Rastreabilidad completa por lote.

---

## 5. Gestión de Inventario y Movimientos

### 5.1 Entrada de Mercancía (Recepción)
Flujo completo de recepción:
1. **Orden de Compra / ASN** (Aviso de expedición previo): El sistema externo notifica la llegada esperada via API o el usuario la crea manualmente.
2. **Descarga y Verificación**: El operario registra los artículos recibidos, su cantidad real y el estado (conforme / dañado / exceso / falta).
3. **Control de Calidad**: Marca los palés/artículos como aptos o en cuarentena.
4. **Asignación de Ubicación**: Manual (el operario elige el hueco) o automática (el sistema sugiere el hueco óptimo según reglas configuradas).
5. **Confirmación**: Se genera el movimiento de entrada y se actualiza el stock.

Datos registrados: fecha/hora, artículo, lote, cantidad, hueco destino, operario, referencia albarán/proveedor.

### 5.2 Salida de Mercancía (Expedición / Picking)
Flujo completo de picking y expedición:
1. **Orden de Salida / Pedido**: Creada por el sistema externo (API) o manualmente. Indica los artículos y cantidades requeridas.
2. **Generación de Tarea de Picking**: El sistema calcula la ruta de picking más eficiente (menor recorrido dentro del almacén) y asigna las tareas al operario.
3. **Confirmación de Picking**: El operario confirma unidad a unidad o por lectura de código de barras/QR.
4. **Verificación de Salida (Packing)**: Control de artículos antes de embalar.
5. **Expedición**: Registro de salida y generación de documentación (albarán, etiquetas).

Criterios de selección de hueco para el picking: FIFO (el más antiguo primero), FEFO (el de menor caducidad), LIFO, o manual.

### 5.3 Movimientos Internos (Reubicación)
- Traslado de artículos de un hueco a otro dentro del mismo almacén o entre almacenes.
- Motivos de movimiento: optimización de espacio, reclasificación de zona, reorganización.
- Registro de origen y destino, cantidad movida, motivo y operario.

### 5.4 Regularización de Inventario
- **Inventario periódico**: El sistema genera listas de conteo por zona o hueco.
- **Inventario cíclico**: Conteo rotativo continuo sin parar operaciones.
- **Ajuste de Stock**: Registro de diferencias con justificación (merma, rotura, error de conteo).

### 5.5 Historial de Movimientos
Cada operación queda registrada de forma permanente e inmutable:
- Tipo de movimiento (Entrada, Salida, Traslado, Ajuste).
- Fecha y hora exacta.
- Artículo, lote, cantidad, unidad de medida.
- Hueco origen y destino.
- Usuario/operario.
- Referencia de documento externo (pedido, albarán).

---

## 6. Reglas de Negocio y Lógica de Ubicación

### 6.1 Asignación Automática de Huecos
El motor de ubicación sugiere el hueco más adecuado basándose en las siguientes reglas (priorizadas y configurables):

1. **Compatibilidad de dimensiones**: El artículo cabe en el hueco (Largo ≤ LargoHueco, Ancho ≤ AnchoHueco, Alto ≤ AlturaLibre).
2. **Compatibilidad de peso**: El peso total no supera la carga máxima del nivel.
3. **Zona adecuada**: El artículo se ubica en la zona correcta (temperatura controlada, peligroso, etc.).
4. **Política de ubicación**: 
   - **Caos organizado**: Se puede poner en cualquier hueco libre compatible.
   - **Ubicación fija**: El artículo tiene un hueco o zona asignada de forma permanente.
   - **ABC por velocidad de rotación**: A (alta rotación) cerca de la salida, C (baja) en zonas lejanas.
5. **Compactación**: Preferir huecos ya con el mismo artículo (si multi-SKU está permitido).
6. **Estado del hueco**: Solo huecos en estado `LIBRE` o `PARCIAL` (si aplica multi-SKU).

### 6.2 Generación de Rutas de Picking
- Algoritmo de ruta óptima basado en la posición de los huecos en el mapa del almacén.
- Soporte para recorrido en serpentina (el más habitual en almacenes de pasillos).
- Agrupación de pickings de múltiples pedidos en una sola ruta (batch picking).
- Picking por zonas (zone picking).

### 6.3 Restricciones Adicionales
- Artículos con fecha de caducidad cercana se priorizan para salida.
- Artículos en cuarentena no pueden ser seleccionados para picking hasta que sean liberados.
- Huecos bloqueados no aceptan ni entrada ni salida.
- Control de segregación: ciertos artículos no pueden almacenarse en la misma zona (ej. incompatibilidades químicas).

---

## 7. Entorno Web — Módulos del Frontend

La aplicación web es una SPA (Single Page Application) moderna con diseño dark-mode, paleta de colores premium y micro-animaciones.

### 7.1 Módulo: Dashboard General
- **KPIs en tiempo real**: % de ocupación del almacén, artículos totales, movimientos del día, huecos libres/ocupados/bloqueados.
- **Gráfica de ocupación por zona**: Gráfico de barras o mapa de calor.
- **Últimos movimientos**: Lista de las últimas operaciones registradas.
- **Alertas activas**: Stock bajo mínimo, artículos próximos a caducar, huecos bloqueados.
- **Resumen de tareas pendientes**: Pedidos de picking por completar, recepciones pendientes.

### 7.2 Módulo: Gestión de Almacenes (Configuración)
- **Asistente de creación de almacén**: Formulario multi-paso para definir almacén → zonas → pasillos → estanterías → niveles → huecos.
- **Importación masiva**: Carga de la topología desde CSV o Excel.
- **Vista de árbol de la estructura**: Árbol colapsable que muestra la jerarquía completa del almacén.
- **Edición de huecos individual**: Cambiar dimensiones, estado, tipo de hueco.

### 7.3 Módulo: Inventario
- **Tabla de inventario completo**: Lista de todos los artículos con su stock y ubicación.
  - Columnas: SKU, Descripción, Lote, Caducidad, Cantidad, Unidad, Almacén, Hueco, Zona.
  - Filtros: Por almacén, zona, artículo, lote, fecha, estado.
  - Ordenación multi-columna.
  - Exportación: CSV, Excel, PDF.
- **Ficha de artículo**: Vista detallada de un artículo con todo su stock por ubicación e historial.
- **Ficha de hueco**: Vista detallada de un hueco con su contenido y estado.

### 7.4 Módulo: Movimientos
- **Registro de Entradas**: Formulario para registrar recepciones, con búsqueda de artículo y asignación de hueco (manual o automática).
- **Registro de Salidas / Picking**: Creación y gestión de órdenes de salida.
- **Movimientos Internos**: Formulario de traslado de artículos entre huecos.
- **Historial de Movimientos**: Tabla con todos los movimientos registrados y filtros avanzados.

### 7.5 Módulo: Catálogo de Artículos
- **Listado de artículos**: Tabla paginada con todos los artículos del catálogo.
- **Creación / edición de artículo**: Formulario completo con todos los atributos.
- **Importación masiva**: Carga de artículos desde CSV/Excel.
- **Gestión de lotes**: Listado y seguimiento de lotes activos.

### 7.6 Módulo: Tareas y Operativa
- **Panel de tareas de picking**: Lista de tareas asignadas al operario con su estado.
- **Guía de picking paso a paso**: Interfaz simplificada para operarios (modo terminal).
- **Recepción guiada**: Flujo paso a paso de recepción de mercancía.

### 7.7 Módulo: Reportes
- **Informe de ocupación**: Estado de huecos por almacén, zona, pasillo.
- **Informe de rotación**: Artículos más y menos movidos en un período.
- **Informe de movimientos**: Todas las operaciones en un rango de fechas.
- **Informe de caducidades**: Artículos próximos a caducar.
- **Informe ABC**: Clasificación de artículos por volumen de movimiento.

### 7.8 Módulo: Administración y Usuarios
- **Gestión de usuarios**: Alta, baja, edición, asignación de roles.
- **Gestión de roles y permisos**: Permisos granulares por módulo y acción.
- **Configuración del sistema**: Parámetros globales, reglas de ubicación, políticas de caducidad.
- **Tokens API**: Gestión de tokens de acceso para sistemas externos.
- **Log de auditoría**: Registro de acciones sensibles de usuarios.

---

## 8. Visor Gráfico 3D

El visor 3D es el componente diferencial del sistema. Renderiza de forma interactiva y en tiempo real el almacén completo con el estado de ocupación de cada hueco.

### 8.1 Funcionalidades del Visor
- **Renderizado 3D completo del almacén**: Suelo, paredes (opcionales), pasillos, estanterías, niveles y huecos.
- **Código de colores por estado de hueco**:
  - 🟢 **Verde**: Libre (0% ocupación).
  - 🟡 **Amarillo**: Parcialmente ocupado (1-99%).
  - 🔴 **Rojo**: Completamente ocupado (100%).
  - ⚫ **Gris oscuro**: Bloqueado.
  - 🔵 **Azul**: Reservado.
  - 🟣 **Morado**: Cuarentena.
- **Navegación interactiva**:
  - Rotación del modelo con clic y arrastre.
  - Zoom con rueda del ratón o pellizco en táctil.
  - Paneo con clic derecho y arrastre.
  - Vista cenital (top view), vista frontal, vista isométrica.
- **Selección y detalle de hueco**: Al hacer clic sobre un hueco, se abre un panel lateral con:
  - Código del hueco, estado, dimensiones.
  - Lista de artículos contenidos (SKU, descripción, cantidad, lote, caducidad).
  - Peso actual vs. máximo.
  - Botones de acción: Registrar entrada, registrar salida, bloquear/desbloquear.
- **Resaltado y búsqueda**: Al buscar un artículo o hueco, el visor navega automáticamente hasta su posición y lo resalta (pulse glow animation).
- **Filtros visuales**: Mostrar solo huecos libres, solo ocupados, solo de una zona, solo con artículo X.
- **Mapa de calor**: Vista de densidad de ocupación superpuesta al modelo 3D.
- **Tour virtual**: Animación automática navegando por los pasillos del almacén.

### 8.2 Construcción del Modelo 3D
- El modelo 3D se genera dinámicamente a partir de los datos de topología almacenados en la base de datos.
- No requiere archivos 3D externos; la geometría se construye proceduralmente (cajas, planos).
- Se actualiza en tiempo real cuando hay cambios en el inventario (WebSocket o polling configurable).

---

## 9. API REST — Integración con Terceros

### 9.1 Principios de Diseño
- RESTful con respuestas en JSON.
- Versionado de API: `/api/v1/...`
- Autenticación: Bearer Token (JWT) o API Key por cabecera `X-API-Key`.
- Rate limiting: configurable por token.
- Respuestas normalizadas: `{ success, data, error, pagination }`.
- Documentación automática: OpenAPI 3.0 / Swagger UI.

### 9.2 Endpoints de Topología

#### Almacenes
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/warehouses` | Listar todos los almacenes |
| `POST` | `/api/v1/warehouses` | Crear un almacén |
| `GET` | `/api/v1/warehouses/{id}` | Obtener un almacén |
| `PUT` | `/api/v1/warehouses/{id}` | Actualizar un almacén |
| `DELETE` | `/api/v1/warehouses/{id}` | Eliminar un almacén (si está vacío) |

#### Zonas y Pasillos
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/warehouses/{id}/zones` | Listar zonas del almacén |
| `POST` | `/api/v1/warehouses/{id}/zones` | Crear zona |
| `GET` | `/api/v1/warehouses/{id}/aisles` | Listar pasillos del almacén |
| `POST` | `/api/v1/warehouses/{id}/aisles` | Crear pasillo |

#### Estanterías, Niveles y Huecos
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/aisles/{id}/racks` | Listar estanterías de un pasillo |
| `POST` | `/api/v1/aisles/{id}/racks` | Crear estantería |
| `GET` | `/api/v1/racks/{id}/locations` | Listar huecos de una estantería |
| `POST` | `/api/v1/racks/{id}/locations/bulk` | Crear múltiples huecos en lote |
| `GET` | `/api/v1/locations/{id}` | Obtener detalle de un hueco |
| `PUT` | `/api/v1/locations/{id}` | Actualizar hueco (estado, dimensiones) |
| `GET` | `/api/v1/locations/{id}/content` | Obtener contenido de un hueco |

### 9.3 Endpoints de Catálogo de Artículos

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/items` | Listar artículos (con filtros y paginación) |
| `POST` | `/api/v1/items` | Crear artículo |
| `GET` | `/api/v1/items/{sku}` | Obtener artículo por SKU |
| `PUT` | `/api/v1/items/{sku}` | Actualizar artículo |
| `DELETE` | `/api/v1/items/{sku}` | Eliminar artículo (si sin stock) |
| `POST` | `/api/v1/items/bulk` | Importar artículos en lote |
| `GET` | `/api/v1/items/{sku}/stock` | Stock total y por ubicación del artículo |
| `GET` | `/api/v1/items/{sku}/movements` | Historial de movimientos del artículo |

### 9.4 Endpoints de Inventario

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/inventory` | Inventario completo (con filtros: almacén, zona, artículo, lote, fecha) |
| `GET` | `/api/v1/inventory/summary` | Resumen de ocupación por almacén/zona |
| `GET` | `/api/v1/inventory/export` | Exportar inventario (CSV, Excel, JSON) |
| `GET` | `/api/v1/inventory/locations/free` | Huecos libres (filtrados por dimensiones mínimas requeridas) |
| `GET` | `/api/v1/inventory/suggest-location` | Sugerir hueco óptimo para un artículo concreto |

### 9.5 Endpoints de Movimientos

#### Entrada de Mercancía
```http
POST /api/v1/movements/in
Content-Type: application/json

{
  "warehouse_id": "WH001",
  "items": [
    {
      "sku": "ART-00123",
      "lot": "L2026001",
      "expiry_date": "2027-12-31",
      "quantity": 50,
      "uom": "ud",
      "location_id": "ALM01-A01-R01-02-03",  // null para asignación automática
      "supplier_ref": "ALB-2026-4521"
    }
  ],
  "notes": "Recepción proveedor XYZ"
}
```

#### Salida de Mercancía
```http
POST /api/v1/movements/out
Content-Type: application/json

{
  "warehouse_id": "WH001",
  "order_ref": "PED-2026-9821",
  "items": [
    {
      "sku": "ART-00123",
      "quantity": 10,
      "uom": "ud",
      "location_id": "ALM01-A01-R01-02-03",  // null para selección automática FIFO/FEFO
      "lot": "L2026001"  // opcional, para forzar lote específico
    }
  ]
}
```

#### Movimiento Interno (Traslado)
```http
PUT /api/v1/movements/transfer
Content-Type: application/json

{
  "sku": "ART-00123",
  "lot": "L2026001",
  "quantity": 20,
  "from_location_id": "ALM01-A01-R01-02-03",
  "to_location_id": "ALM01-B02-R03-01-05",
  "reason": "Optimización de espacio"
}
```

#### Consulta de Movimientos
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/movements` | Historial (filtros: tipo, fecha, artículo, hueco, usuario) |
| `GET` | `/api/v1/movements/{id}` | Detalle de un movimiento |
| `GET` | `/api/v1/movements/export` | Exportar historial (CSV, Excel) |

### 9.6 Endpoints de Órdenes

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/orders` | Listar órdenes de entrada/salida |
| `POST` | `/api/v1/orders/inbound` | Crear orden de recepción (ASN) |
| `POST` | `/api/v1/orders/outbound` | Crear orden de salida/picking |
| `GET` | `/api/v1/orders/{id}` | Obtener detalle de una orden |
| `PUT` | `/api/v1/orders/{id}/status` | Actualizar estado de una orden |
| `GET` | `/api/v1/orders/{id}/picking-list` | Obtener lista de picking de la orden |

### 9.7 Endpoints de Estadísticas y Reporting

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/reports/occupancy` | Informe de ocupación por almacén/zona/pasillo |
| `GET` | `/api/v1/reports/abc` | Clasificación ABC de artículos |
| `GET` | `/api/v1/reports/expiry` | Artículos próximos a caducar |
| `GET` | `/api/v1/reports/rotation` | Rotación de stock en un período |
| `GET` | `/api/v1/reports/movements-summary` | Resumen de movimientos (entradas vs salidas) |

### 9.8 Webhooks (Notificaciones Push)
El sistema puede notificar a sistemas externos via webhook ante determinados eventos:
- `inventory.in` — Entrada de mercancía confirmada.
- `inventory.out` — Salida de mercancía confirmada.
- `inventory.transfer` — Traslado interno confirmado.
- `stock.low` — Stock por debajo del mínimo.
- `item.expiry_soon` — Artículo próximo a caducar.
- `location.blocked` — Hueco bloqueado.

---

## 10. Seguridad y Autenticación

- **Autenticación de usuarios**: JWT (JSON Web Token) con expiración y refresh token.
- **Autenticación de API externa**: API Key por cabecera `X-API-Key`, con scopes de permisos (read-only, write, admin).
- **RBAC (Role-Based Access Control)**: Permisos por rol: Administrador, Responsable, Operario, Auditor.
- **HTTPS obligatorio** en todos los entornos excepto desarrollo local.
- **Rate limiting**: Límite de peticiones por token y por IP.
- **Auditoría**: Log de todas las operaciones con IP, usuario y timestamp.
- **Multi-tenant**: Los datos de cada empresa están completamente aislados.

---

## 11. Notificaciones y Alertas

El sistema genera alertas automáticas ante las siguientes situaciones:
- Stock de un artículo por debajo del mínimo definido.
- Artículos con fecha de caducidad en los próximos N días (configurable).
- Almacén con ocupación superior al umbral de alerta (ej. > 85%).
- Huecos bloqueados que impiden operaciones.
- Diferencias detectadas en inventario.
- Errores en integraciones API.

Las alertas se muestran en el dashboard y pueden enviarse por email o webhook.

---

## 12. Reporting y Exportación

- Todos los informes son exportables en **CSV**, **Excel (.xlsx)** y **PDF**.
- Los datos de inventario pueden consultarse en tiempo real o para una fecha concreta (snapshot histórico).
- Exportación completa del inventario bajo demanda.

---

## 13. Modelo de Datos (Esquema Conceptual)

```
COMPANY           WAREHOUSE          ZONE                AISLE
─────────         ─────────          ────                ─────
id (PK)           id (PK)            id (PK)             id (PK)
name              company_id (FK)    warehouse_id (FK)   zone_id (FK)
tax_id            name               name                name / code
address           code               code                direction (X/Y)
                  address            type                length_m
                  active             temp_min            position_x
                  dimensions         temp_max            position_y

RACK               LEVEL              LOCATION             ITEM
────               ─────              ────────             ────
id (PK)            id (PK)            id (PK)              id (PK)
aisle_id (FK)      rack_id (FK)       rack_id (FK)         company_id (FK)
name / code        level_number       level_id (FK)        sku
side (L/R)         height_from_floor  level_number         ean
position_offset    free_height_cm     column_number        name
num_columns        max_weight_kg      code (full)          description
num_levels                            max_length_cm        family
                                      max_width_cm         uom_base
                                      max_height_cm        weight_kg
                                      max_weight_kg        dimensions
                                      status               temp_min
                                      type                 temp_max
                                      multi_sku            fifo_fefo_lifo
                                                           stock_min
                                                           stock_max

STOCK                MOVEMENT             ORDER
─────                ────────             ─────
id (PK)              id (PK)              id (PK)
location_id (FK)     type                 company_id (FK)
item_id (FK)         item_id (FK)         warehouse_id (FK)
lot                  lot                  type (in/out)
expiry_date          quantity             status
quantity             uom                  external_ref
uom                  from_location (FK)   created_at
updated_at           to_location (FK)
                     user_id (FK)
                     order_id (FK)
                     timestamp
                     notes

USER                 ROLE               API_TOKEN
────                 ────               ─────────
id (PK)              id (PK)            id (PK)
company_id (FK)      name               company_id (FK)
name                 permissions[]      token_hash
email                                   name
password_hash                           scopes[]
role_id (FK)                            active
active                                  last_used_at
```

---

## 14. Pila Tecnológica Propuesta

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18+, Vite, TypeScript |
| **Estilos** | Vanilla CSS con Design System propio (dark mode) |
| **Visor 3D** | Three.js + React Three Fiber + Drei |
| **Gestión de estado** | Zustand o Redux Toolkit |
| **Tablas y gráficas** | TanStack Table, Recharts |
| **Backend / API** | Node.js + Express (o FastAPI Python) |
| **Base de datos** | PostgreSQL (relacional, con transacciones) |
| **ORM** | Prisma (Node) o SQLAlchemy (Python) |
| **Autenticación** | JWT + bcrypt |
| **Documentación API** | Swagger / OpenAPI 3.0 |
| **WebSockets** | Socket.IO (actualización en tiempo real del visor 3D) |
| **Exportación** | ExcelJS, PDFKit |
| **Contenerización** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |

---

## 15. Glosario

| Término | Definición |
|---|---|
| **SGA** | Sistema de Gestión de Almacenes |
| **SKU** | Stock Keeping Unit — código único de referencia de artículo |
| **EAN** | European Article Number — código de barras estándar |
| **Hueco / Slot / Location** | Unidad mínima de almacenamiento físico |
| **Picking** | Proceso de recogida de artículos para preparar un pedido |
| **FIFO** | First In, First Out — el primero en entrar es el primero en salir |
| **FEFO** | First Expired, First Out — el de menor caducidad sale primero |
| **ASN** | Advanced Shipping Notice — aviso previo de expedición de proveedor |
| **Multi-tenant** | Arquitectura que permite a múltiples empresas compartir el sistema con datos aislados |
| **Lote** | Agrupación de artículos fabricados en el mismo proceso, con misma caducidad |
| **KPI** | Key Performance Indicator — indicador clave de rendimiento |
| **Webhook** | Notificación HTTP automática enviada a un sistema externo cuando ocurre un evento |
