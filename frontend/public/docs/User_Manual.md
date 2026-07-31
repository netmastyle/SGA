# Manual de Usuario — SGA/WMS

Sistema de Gestión de Almacenes · Versión 1.0 · Julio 2026

---

## Acceso a la aplicación

**URL:** [https://sga.iaragon.com](https://sga.iaragon.com)

### Iniciar sesión

1. Abre el navegador y accede a `https://sga.iaragon.com`
2. Introduce tu **email** y **contraseña**
3. Pulsa **Iniciar sesión**

> Credenciales de demostración: `admin@sga-demo.local` / `Admin123!`

La sesión se mantiene activa automáticamente. Si llevas más de 15 minutos sin actividad, el sistema renueva el token de forma transparente. Solo se cerrará la sesión si el token de refresco expira (7 días de inactividad).

---

## Navegación

El menú lateral izquierdo da acceso a todas las secciones:

| Sección | Descripción |
|---|---|
| **Dashboard** | Resumen general y KPIs |
| **Almacenes** | Gestión de almacenes y su topología |
| **Artículos** | Catálogo de productos |
| **Contenedores** | Palés, cajas y otros contenedores (LPN) |
| **Nº de serie** | Seguimiento de artículos con número de serie |
| **Inventario** | Consulta de stock en tiempo real |

En la parte inferior del menú aparece tu email y el botón **Cerrar sesión**.

---

## Dashboard

La pantalla de inicio muestra un resumen de la actividad:

- **Total de almacenes** activos en el sistema
- **Total de artículos** en el catálogo
- Secciones de tareas pendientes e incidencias (en desarrollo)

---

## Almacenes

### Ver la lista de almacenes

Desde el menú lateral pulsa **Almacenes**. Verás una tabla con todos los almacenes y su estado (Activo, Inactivo, Mantenimiento).

### Crear un almacén

1. Pulsa el botón **Nuevo almacén**
2. Rellena los campos:
   - **Código**: identificador único (ej. `ALM01`)
   - **Nombre**: nombre descriptivo
   - **Dirección** (opcional)
   - **Responsable** (opcional)
   - **Estado**: Activo / Inactivo / Mantenimiento
3. Pulsa **Guardar**

### Editar un almacén

1. En la tabla, pulsa el icono de edición de la fila
2. Modifica los campos necesarios
3. Pulsa **Guardar**

### Ver el detalle de un almacén

Pulsa sobre el nombre del almacén en la tabla para acceder a su detalle. Desde ahí puedes:
- Ver y gestionar la **topología** (zonas, pasillos, estanterías, niveles, ubicaciones)
- Consultar el **stock** por ubicación
- Acceder al **visor 3D**

---

## Topología del almacén

La topología define la estructura física del almacén de forma jerárquica:

```
Almacén
  └── Zona (Z01, Z02...)
        └── Pasillo (P01, P02...)
              └── Estantería / Rack (R01, R02...)
                    └── Nivel (N1, N2...)
                          └── Ubicación (A-01-1-1...)
```

### Crear una zona

1. En el detalle del almacén, ve a la pestaña **Topología**
2. Pulsa **Añadir zona**
3. Introduce el código, nombre y tipo:
   - **Normal**: zona estándar
   - **Temperatura controlada**: requiere rango de temperatura
   - **Mercancía peligrosa**: para ADR/HAZMAT
   - **Cuarentena**: para artículos en espera de validación
   - **Expedición / Recepción**: zonas de entrada/salida
4. Pulsa **Guardar**

### Crear un pasillo

1. Selecciona la zona en el árbol
2. Pulsa **Añadir pasillo**
3. Indica el código y el eje de orientación (X o Y)
4. Opcionalmente, introduce las coordenadas de inicio en metros
5. Pulsa **Guardar**

### Crear una estantería (rack)

1. Selecciona el pasillo
2. Pulsa **Añadir estantería**
3. Configura:
   - **Código**: identificador (ej. `R01`)
   - **Tipo**: Convencional / Drive-In / Voladizo / Altillo
   - **Lado**: izquierdo o derecho del pasillo
   - **Columnas** y **niveles**
4. Pulsa **Guardar**

### Crear un nivel

1. Selecciona la estantería
2. Pulsa **Añadir nivel**
3. Introduce el número de nivel (1 = suelo, 2 = primera altura...)
4. Opcionalmente, altura desde el suelo y carga máxima en kg

### Crear una ubicación

1. Selecciona el nivel
2. Pulsa **Añadir ubicación**
3. Introduce el código de ubicación (ej. `P01-R01-N1-01`)
4. Opcionalmente, dimensiones máximas y peso máximo

### Bloquear / desbloquear una ubicación

En el listado de ubicaciones, pulsa **Bloquear** e indica el motivo. Una ubicación bloqueada no acepta entradas ni salidas. Pulsa **Desbloquear** para habilitarla de nuevo.

---

## Visor 3D

Accede al visor 3D desde el detalle de un almacén pulsando **Vista 3D**.

### Controles de navegación

| Acción | Cómo hacerlo |
|---|---|
| Rotar la cámara | Clic izquierdo + arrastrar |
| Hacer zoom | Rueda del ratón |
| Desplazar la vista | Clic derecho + arrastrar |
| Seleccionar ubicación | Clic sobre una celda |

### Colores de las ubicaciones

| Color | Estado |
|---|---|
| Verde | Disponible (vacía) |
| Naranja/Amarillo | Ocupada |
| Rojo | Bloqueada |
| Gris | Reservada |

### Panel de detalle

Al seleccionar una ubicación aparece un panel lateral con su código, estado, dimensiones y el stock que contiene.

### Mover pasillos

En el modo edición del visor puedes arrastrar pasillos para ajustar su posición en el plano del almacén.

---

## Artículos

### Ver el catálogo

Desde el menú pulsa **Artículos**. La tabla muestra SKU, nombre, familia y estado de cada artículo. Usa el buscador para filtrar por texto.

### Crear un artículo

1. Pulsa **Nuevo artículo**
2. Rellena los campos obligatorios:
   - **SKU**: código único del artículo
   - **Nombre**: descripción del artículo
3. Campos opcionales:
   - **Familia / Subfamilia**: clasificación
   - **Unidad base**: `UNIT`, `KG`, `LITER`, etc.
   - **Control de lote**: actívalo si el artículo requiere seguimiento por lote
   - **Control de caducidad**: actívalo si gestiona fechas de caducidad
   - **Nº de serie**: actívalo si cada unidad tiene número de serie individual
4. Pulsa **Guardar**

### Editar un artículo

Pulsa el icono de edición en la fila del artículo. Todos los campos son editables excepto el SKU.

---

## Contenedores (Handling Units / LPN)

Los contenedores son las unidades físicas que agrupan mercancía: palés, cajas, contenedores, etc. Cada contenedor tiene un código único (LPN — License Plate Number).

### Ver contenedores

Desde el menú pulsa **Contenedores**. Usa el buscador para localizar un contenedor por código.

### Crear un contenedor

1. Pulsa **Nuevo contenedor**
2. Rellena:
   - **Código LPN**: identificador único (ej. `PAL-0001`)
   - **Almacén**: almacén donde se ubica
   - **Tipo**: Palé / Caja / Contenedor / Otro
   - **Ubicación** (opcional): ubicación inicial dentro del almacén
3. Pulsa **Guardar**

### Mover un contenedor

1. Localiza el contenedor en la tabla
2. Pulsa **Mover**
3. Selecciona la nueva ubicación
4. Añade un motivo (opcional)
5. Pulsa **Confirmar**

---

## Números de serie

Permite el seguimiento individual de artículos con número de serie.

> Solo los artículos con la opción **Control de Nº de serie** activada pueden registrarse aquí.

### Ver números de serie

Desde el menú pulsa **Nº de serie**. Puedes filtrar por estado.

### Registrar un número de serie

1. Pulsa **Registrar**
2. Selecciona el artículo (solo aparecen los que tienen `serialControlled = true`)
3. Introduce el número de serie
4. Selecciona el almacén y, opcionalmente, el contenedor (LPN)
5. Pulsa **Guardar**

### Estados posibles

| Estado | Descripción |
|---|---|
| **En stock** | Disponible en el almacén |
| **Expedido** | Ha salido del almacén |
| **Devuelto** | Devuelto por el cliente |
| **Dado de baja** | Inutilizable (dañado, caducado...) |

### Cambiar el estado

Desde la tabla, en la fila del número de serie:
- **Expedir**: marca como expedido
- **Devolver**: registra una devolución
- **Dar de baja**: marca como scrapped

---

## Inventario

### Consultar el stock

Desde el menú pulsa **Inventario**. Verás el stock agrupado por contenedor y artículo.

Filtros disponibles:
- **Almacén**: filtra por almacén concreto
- **Estado de ubicación**: disponible, ocupada, bloqueada...
- **Búsqueda**: por código de artículo, SKU o nombre

La tabla muestra:
- Artículo y SKU
- Contenedor (LPN)
- Ubicación
- Cantidad disponible / reservada / bloqueada / cuarentena

Usa la **paginación** en la parte inferior para navegar entre páginas de resultados.

---

## Gestión de usuarios y roles

> Esta sección solo está disponible para usuarios con el rol **Administrador del sistema**.

La gestión de usuarios y roles se realiza actualmente a través de la API REST directamente (disponible en `https://api-sga.iaragon.com/api/docs`). La interfaz gráfica de administración estará disponible en próximas versiones.

### Roles disponibles

| Rol | Qué puede hacer |
|---|---|
| **Administrador del sistema** | Acceso total: usuarios, roles, empresas, almacenes, inventario |
| **Responsable de almacén** | Gestionar almacenes, artículos, topología e inventario |
| **Operario** | Ver stock, crear movimientos, ejecutar tareas, mover contenedores |
| **Auditor / Gerencia** | Solo consulta: almacenes, inventario, artículos e informes |

---

## Preguntas frecuentes

**¿Puedo recuperar un artículo borrado?**
Los borrados son lógicos (soft-delete). El registro permanece en la base de datos. Contacta con el administrador del sistema para restaurarlo.

**¿Qué pasa si intento acceder a una sección sin permisos?**
El sistema mostrará un error `403 Permisos insuficientes`. Contacta con tu administrador para que asigne el permiso necesario a tu rol.

**¿El visor 3D funciona en móvil?**
El visor 3D está optimizado para escritorio. En móvil puede funcionar con rendimiento reducido.

**¿Cómo cambio mi contraseña?**
Actualmente el cambio de contraseña se realiza a través de la API o por el administrador. La funcionalidad de perfil de usuario estará disponible en próximas versiones.

**¿Puedo usar el sistema desde varios dispositivos a la vez?**
Sí. El token de refresco tiene duración de 7 días. Al iniciar sesión en otro dispositivo la sesión anterior sigue activa hasta que expire.

---

## Soporte

Para incidencias técnicas o preguntas sobre el sistema, contacta con el administrador de la plataforma.

API interactiva (Swagger): [https://api-sga.iaragon.com/api/docs](https://api-sga.iaragon.com/api/docs)
