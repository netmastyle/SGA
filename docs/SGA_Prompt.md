Actúa como arquitecto senior de software, analista funcional experto en logística y desarrollador full-stack. Necesito que diseñes y desarrolles un Sistema de Gestión de Almacenes, SGA/WMS, completo, moderno, multiempresa y multialmacén, basado en la siguiente especificación funcional.

El sistema debe permitir digitalizar la estructura física de uno o varios almacenes, gestionar artículos, stock, ubicaciones, movimientos, órdenes de entrada y salida, picking, packing, expedición, inventario, reglas de ubicación automática, trazabilidad, reporting, integración mediante API REST y visualización 3D interactiva del almacén.

El sistema debe ser multi-tenant. Cada empresa debe tener sus propios usuarios, almacenes, artículos, ubicaciones, stock, órdenes, movimientos, reglas, tokens API, informes y configuración. Debe existir aislamiento total de datos entre empresas.

La aplicación debe tener una arquitectura robusta, mantenible y escalable. Propón y desarrolla una solución con frontend web moderno, backend API, base de datos relacional, autenticación segura, roles y permisos, auditoría, documentación OpenAPI y despliegue mediante Docker.

Tecnologías preferentes:

* Frontend: React 18+, Vite, TypeScript.
* Estilos: CSS propio con design system, dark mode, interfaz premium y responsive.
* Estado frontend: Zustand o Redux Toolkit.
* Tablas: TanStack Table.
* Gráficas: Recharts.
* Visor 3D: Three.js, React Three Fiber y Drei.
* Backend: Node.js con Express o NestJS. Si se considera más adecuado, justificar alternativa con FastAPI.
* Base de datos: PostgreSQL.
* ORM: Prisma si se usa Node.js, SQLAlchemy si se usa Python.
* Autenticación: JWT con refresh token, bcrypt/argon2 para contraseñas.
* API Docs: OpenAPI 3.0 / Swagger UI.
* Tiempo real: WebSockets mediante Socket.IO o equivalente.
* Exportaciones: Excel, CSV y PDF.
* Despliegue: Docker y Docker Compose.
* CI/CD: GitHub Actions.

El sistema debe incluir los siguientes módulos funcionales.

1. Gestión multiempresa:

* Crear, editar, activar y desactivar empresas.
* Campos mínimos: nombre, CIF/NIF, dirección, logotipo, estado, fecha de alta.
* Aislamiento total de datos por empresa.
* Un usuario administrador del sistema puede gestionar empresas.
* Los usuarios normales solo pueden acceder a su empresa.

2. Gestión de usuarios, roles y permisos:

* Usuarios con nombre, email, contraseña cifrada, estado, empresa y rol.
* Roles base: Administrador del sistema, Responsable de almacén, Operario, Auditor/Gerencia.
* Permisos granulares por módulo y acción.
* Ejemplos de permisos:

  * warehouse.read
  * warehouse.create
  * warehouse.update
  * warehouse.delete
  * inventory.read
  * inventory.adjust
  * movement.create
  * movement.cancel
  * order.create
  * order.update
  * order.cancel
  * task.assign
  * task.execute
  * report.export
  * api_token.manage
  * audit.read
  * user.manage
* Debe ser posible limitar permisos por empresa y almacén.
* Implementar middleware de autorización en backend.
* Implementar protección de rutas en frontend.

3. Topología física del almacén:
   El sistema debe modelar la estructura jerárquica:
   Empresa → Almacén → Zona → Pasillo → Estantería/Bahía → Nivel → Hueco/Ubicación.

Almacén:

* Código.
* Nombre.
* Dirección física.
* Responsable.
* Descripción.
* Dimensiones largo, ancho y alto.
* Estado: Activo, Inactivo, En mantenimiento.
* Relación con empresa.

Zona:

* Código.
* Nombre.
* Tipo: Normal, Temperatura controlada, Mercancía peligrosa, Cuarentena, Expedición, Recepción.
* Rango de temperatura mínimo y máximo.
* Rango de humedad opcional.
* Restricciones específicas.
* Relación con almacén.

Pasillo:

* Código único dentro del almacén.
* Dirección en eje X o Y.
* Coordenadas X/Y de inicio.
* Longitud.
* Anchura.
* Estanterías a izquierda y/o derecha.
* Relación con zona.

Estantería/Bahía:

* Código.
* Tipo: Convencional, Drive-in, Cantilever, Mezzanine.
* Lado del pasillo: izquierdo/derecho.
* Offset desde el inicio del pasillo.
* Número de columnas.
* Número de niveles.
* Dimensiones por módulo.
* Carga máxima por nivel.
* Relación con pasillo.

Nivel:

* Número de nivel.
* Altura desde suelo.
* Altura libre.
* Carga máxima.
* Relación con estantería.

Hueco/Ubicación:

* Código único normalizado con formato configurable, por ejemplo ALM01-A01-R01-02-03.
* Dimensiones máximas admisibles: largo, ancho, alto.
* Peso máximo admisible.
* Estado: LIBRE, PARCIAL, OCUPADO, BLOQUEADO, RESERVADO, CUARENTENA.
* Tipo: Normal, Picking, Reserva, Bulto completo, Especial.
* Configuración multi-SKU o single-SKU.
* Coordenadas calculadas para visor 3D.
* Relación con rack/nivel/almacén/empresa.
* Debe poder bloquearse/desbloquearse con motivo obligatorio.

4. Catálogo de artículos:
   Cada artículo debe incluir:

* SKU único por empresa.
* EAN/UPC.
* Código proveedor.
* Nombre.
* Descripción larga.
* Familia.
* Subfamilia.
* Marca.
* Proveedor.
* Largo, ancho, alto.
* Peso unitario.
* Unidad base: unidad, kg, litros, caja, palet u otra.
* Factores de conversión entre unidades.
* Apilabilidad.
* Máximo de unidades apiladas.
* Requisitos de temperatura.
* Requisitos de humedad.
* Mercancía peligrosa y clase ADR.
* Fragilidad.
* Gestión de lote sí/no.
* Gestión de caducidad sí/no.
* Política de salida: FIFO, FEFO, LIFO o manual.
* Stock mínimo y máximo.
* Imagen.
* Estado activo/inactivo.

Debe existir gestión de unidades de embalaje:

* Unidad suelta.
* Caja.
* Palet.
* Otro embalaje configurable.
* Dimensiones.
* Peso.
* EAN por embalaje.
* Factor de conversión.

Debe existir gestión de lotes:

* Número de lote.
* Fecha de fabricación.
* Fecha de caducidad.
* País de origen.
* Estado.
* Trazabilidad completa.

5. Gestión de unidades logísticas:
   Añadir entidad Handling Unit, Pallet, Container o LPN.
   Debe permitir:

* Crear matrícula logística única.
* Asociar uno o varios artículos/lotes/cantidades.
* Asociar la unidad logística a una ubicación.
* Mover la unidad logística completa.
* Consultar contenido.
* Imprimir etiqueta.
* Registrar peso y dimensiones.
* Estados: Activa, Cerrada, Expedida, Bloqueada, En cuarentena.

6. Inventario:
   El inventario debe distinguir:

* Stock físico.
* Stock reservado.
* Stock disponible.
* Stock bloqueado.
* Stock en cuarentena.
* Stock pendiente de recepción.
* Stock pendiente de expedición.

Debe existir tabla o vista de stock por:

* Empresa.
* Almacén.
* Zona.
* Ubicación.
* Artículo.
* Lote.
* Caducidad.
* Unidad logística.
* Unidad de medida.

Reglas obligatorias:

* No permitir stock negativo.
* No permitir salida desde huecos bloqueados.
* No permitir picking de stock en cuarentena.
* No permitir superar peso o volumen máximo de ubicación.
* No permitir mezclar SKUs en huecos single-SKU.
* No permitir movimientos entre empresas distintas.
* No permitir borrar artículos con stock o movimientos.
* No permitir eliminar almacenes con stock o movimientos.

7. Recepción de mercancía:
   Debe existir flujo completo:

* Orden de compra o ASN.
* Creación manual o vía API.
* Estados: Borrador, Pendiente, En recepción, Parcial, Completada, Cancelada, Con incidencia.
* Registro de llegada.
* Validación de cantidades esperadas vs recibidas.
* Registro de exceso, falta o daño.
* Control de calidad.
* Envío a cuarentena si aplica.
* Asignación de ubicación manual o automática.
* Confirmación de entrada.
* Generación de movimientos de entrada.
* Actualización de stock.
* Registro de documentos externos: albarán, proveedor, referencia ASN.
* Posibilidad de adjuntar fotos o documentos.

8. Salida, picking, packing y expedición:
   Debe existir flujo completo:

* Orden de salida creada manualmente o vía API.
* Estados: Borrador, Pendiente, Reservada, En picking, Picking parcial, Picked, En packing, Expedida, Cancelada, Con incidencia.
* Reserva de stock.
* Generación de tareas de picking.
* Asignación a operarios.
* Cálculo de ruta óptima.
* Soporte para picking individual, batch picking y zone picking.
* Confirmación mediante escaneo de ubicación y artículo.
* Aplicación de FIFO, FEFO, LIFO o selección manual.
* Validación de lote si aplica.
* Packing con validación final.
* Creación de paquetes/cajas.
* Peso y dimensiones de paquete.
* Generación de etiquetas.
* Generación de albarán.
* Registro de transportista.
* Número de seguimiento.
* Confirmación de expedición.
* Webhook de salida confirmada.

9. Reposición:
   Debe existir gestión de ubicaciones de picking y reserva.
   Funcionalidades:

* Definir ubicación principal de picking por SKU.
* Definir ubicaciones de reserva.
* Umbral mínimo de reposición.
* Umbral máximo.
* Generación automática de tareas de reposición.
* Reposición previa al picking si el stock en picking no es suficiente.
* Priorización por pedidos pendientes.
* Confirmación mediante escaneo origen/destino.

10. Movimientos internos:
    Debe permitir:

* Traslado de stock entre ubicaciones.
* Traslado de unidad logística completa.
* Cambio de estado de stock.
* Movimiento a cuarentena.
* Movimiento desde cuarentena a disponible.
* Compactación de stock.
* Reubicación sugerida por sistema.
* Registro obligatorio de motivo.
* Registro de usuario, fecha/hora, origen, destino, artículo, lote y cantidad.

11. Regularización e inventario:
    Debe incluir:

* Inventario periódico.
* Inventario cíclico.
* Conteo por zona.
* Conteo por hueco.
* Conteo por artículo.
* Doble conteo opcional.
* Ajuste de stock con motivo obligatorio.
* Registro de diferencias.
* Aprobación por responsable si la diferencia supera un umbral.
* Historial completo.

12. Gestión de tareas:
    Crear entidad TASK.
    Campos:

* ID.
* Empresa.
* Almacén.
* Tipo: Recepción, Picking, Packing, Reposición, Traslado, Inventario, Control de calidad, Incidencia.
* Estado: Pendiente, Asignada, En proceso, Pausada, Completada, Cancelada, Bloqueada.
* Prioridad: Baja, Normal, Alta, Urgente.
* Operario asignado.
* Orden asociada.
* Ubicación origen.
* Ubicación destino.
* SKU/lote/cantidad si aplica.
* Fecha de creación.
* Fecha límite.
* Fecha de inicio.
* Fecha de finalización.
* Comentarios.
* Auditoría.

Debe existir panel de tareas para responsables y modo operativo simplificado para operarios.

13. Gestión de incidencias:
    Crear módulo de incidencias.
    Tipos:

* Mercancía dañada.
* Diferencia de cantidad.
* Error de picking.
* Hueco bloqueado/inaccesible.
* Lote incorrecto.
* Artículo no encontrado.
* Integración fallida.
* Rotura.
* Merma.
* Otra.

Campos:

* Tipo.
* Severidad.
* Estado.
* Descripción.
* Usuario creador.
* Usuario responsable.
* Orden/movimiento/tarea asociada.
* Evidencias/fotos.
* Resolución.
* Fecha de creación.
* Fecha de cierre.

14. Devoluciones:
    Debe existir flujo de devolución:

* Crear devolución manual o vía API.
* Asociar a pedido original si existe.
* Recepción de devolución.
* Validación de artículos.
* Inspección de estado.
* Decisión: reincorporar a stock, enviar a cuarentena, marcar como dañado, desechar.
* Movimiento de entrada o ajuste correspondiente.
* Trazabilidad completa.

15. Motor de ubicación automática:
    Debe sugerir huecos en entradas, reposiciones y movimientos.
    Reglas priorizadas y configurables:

* Compatibilidad de dimensiones.
* Compatibilidad de peso.
* Zona adecuada.
* Temperatura/humedad.
* Mercancía peligrosa.
* Incompatibilidades químicas o de familia.
* Política fija o caótica.
* ABC por rotación.
* Proximidad a expedición.
* Compactación con mismo SKU/lote.
* Preferencia por huecos parcialmente ocupados compatibles.
* Exclusión de bloqueados, reservados o cuarentena.
* Multi-SKU/single-SKU.
* Capacidad restante.

El motor debe devolver:

* Ubicación sugerida.
* Puntuación.
* Motivos de selección.
* Alternativas.
* Motivos de descarte de ubicaciones incompatibles.

16. Rutas de picking:
    Debe calcular rutas eficientes.
    Soportar:

* Recorrido en serpentina.
* Ruta por pasillos.
* Picking por zonas.
* Batch picking.
* Priorización por urgencia de pedido.
* Ordenación de tareas por coordenadas.
* Visualización de ruta en frontend.
* Opcionalmente visualización en visor 3D.

17. Escaneo y etiquetas:
    Debe existir soporte transversal para:

* Escaneo de SKU.
* Escaneo de EAN.
* Escaneo de ubicación.
* Escaneo de lote.
* Escaneo de unidad logística.
* Generación de etiquetas QR/código de barras.
* Impresión de etiquetas de ubicación, artículo, palet, caja y expedición.
* Validación de doble escaneo para evitar errores.

18. Visor gráfico 3D:
    Debe renderizar dinámicamente el almacén a partir de la topología de base de datos.
    Debe incluir:

* Suelo.
* Paredes opcionales.
* Zonas.
* Pasillos.
* Estanterías.
* Niveles.
* Huecos.
* Código de colores por estado:

  * Verde libre.
  * Amarillo parcial.
  * Rojo ocupado.
  * Gris bloqueado.
  * Azul reservado.
  * Morado cuarentena.
* Navegación con orbit controls.
* Zoom.
* Paneo.
* Vistas predefinidas: cenital, frontal, lateral, isométrica.
* Selección de hueco.
* Panel lateral con detalle.
* Búsqueda de SKU, lote, hueco o unidad logística.
* Resaltado visual.
* Filtros por zona, estado, artículo, lote, ocupación.
* Mapa de calor de ocupación.
* Tour virtual.
* Actualización en tiempo real mediante WebSocket o polling configurable.
* Optimización de rendimiento para almacenes grandes.

19. Dashboard:
    Debe mostrar:

* Ocupación general.
* Ocupación por almacén/zona.
* Huecos libres, ocupados, parciales, bloqueados y reservados.
* Movimientos del día.
* Recepciones pendientes.
* Pedidos pendientes.
* Tareas pendientes.
* Alertas activas.
* Stock bajo mínimo.
* Caducidades próximas.
* Incidencias abiertas.
* Errores de integración.
* KPIs de productividad.

20. Reporting:
    Debe incluir informes:

* Ocupación.
* Inventario completo.
* Stock por ubicación.
* Stock por artículo.
* Movimientos.
* Rotación.
* ABC.
* Caducidades.
* Incidencias.
* Productividad por operario.
* Tareas completadas.
* Diferencias de inventario.
* Recepciones.
* Expediciones.
* Histórico de snapshots de inventario.

Todos los informes deben poder exportarse a CSV, Excel y PDF.

21. API REST:
    Diseñar API REST versionada bajo /api/v1.
    Debe usar JSON.
    Debe tener respuesta normalizada:
    {
    "success": true,
    "data": {},
    "error": null,
    "pagination": {}
    }

Debe incluir paginación, filtros y ordenación en listados.

Endpoints mínimos:

* Auth.
* Companies.
* Users.
* Roles.
* Warehouses.
* Zones.
* Aisles.
* Racks.
* Levels.
* Locations.
* Items.
* Lots.
* Packaging units.
* Handling units.
* Inventory.
* Movements.
* Inbound orders.
* Outbound orders.
* Returns.
* Tasks.
* Incidents.
* Reports.
* API tokens.
* Webhooks.
* Audit logs.
* 3D topology data.

Debe documentarse con OpenAPI/Swagger.

22. Webhooks:
    Debe permitir configurar webhooks por empresa.
    Eventos:

* inventory.in
* inventory.out
* inventory.transfer
* stock.low
* item.expiry_soon
* location.blocked
* order.created
* order.completed
* picking.completed
* shipment.dispatched
* return.received
* incident.created
* integration.error

Debe incluir:

* URL destino.
* Secret para firma.
* Reintentos.
* Log de entregas.
* Estado de cada intento.
* Firma HMAC.
* Activación/desactivación.

23. Seguridad:
    Implementar:

* JWT access token.
* Refresh token.
* Hash seguro de contraseñas.
* Expiración de sesión.
* HTTPS obligatorio en producción.
* Rate limiting.
* Protección CORS.
* Protección contra inyección SQL mediante ORM.
* Validación de entrada.
* Sanitización.
* RBAC.
* API keys con scopes.
* Hash de tokens API en base de datos.
* Auditoría de acciones sensibles.
* Separación multi-tenant estricta en todas las queries.
* Correlation ID para trazabilidad.

24. Auditoría:
    Registrar:

* Login/logout.
* Creación, edición y borrado de entidades críticas.
* Cambios de stock.
* Ajustes manuales.
* Cambios de permisos.
* Generación o revocación de tokens.
* Importaciones masivas.
* Exportaciones.
* Errores de integración.
* Antes/después de cada cambio.
* Usuario.
* IP.
* User-agent.
* Timestamp.
* Empresa.
* Almacén.
* Entidad afectada.

25. Importaciones masivas:
    Debe permitir importar:

* Artículos.
* Ubicaciones.
* Topología de almacén.
* Stock inicial.
* Proveedores si se añaden.
* Clientes si se añaden.

Debe incluir:

* Plantilla descargable.
* Validación previa.
* Vista de errores por fila.
* Confirmación antes de importar.
* Importación todo/nada o parcial.
* Log de importación.
* Reintento de errores.
* Mapeo de columnas.

26. Notificaciones:
    Debe generar alertas por:

* Stock bajo mínimo.
* Sobrestock.
* Caducidad próxima.
* Ocupación superior a umbral.
* Huecos bloqueados.
* Diferencias de inventario.
* Incidencias abiertas.
* Pedidos retrasados.
* Errores API.
* Fallo de webhook.
* Tareas vencidas.

Canales:

* Dashboard.
* Email.
* Webhook.
* Notificación interna.

27. Interfaz de operario:
    Debe existir una interfaz responsive mobile-first o PWA.
    Optimizada para pistolas Android o tablets.
    Debe incluir:

* Login rápido.
* Lista de tareas asignadas.
* Flujo guiado paso a paso.
* Botones grandes.
* Escaneo.
* Confirmación visual clara.
* Mensajes de error directos.
* Modo recepción.
* Modo picking.
* Modo reposición.
* Modo traslado.
* Modo inventario.

28. Modo offline opcional:
    Diseñar soporte opcional para:

* Detección de conexión.
* Cola local de acciones no críticas.
* Sincronización posterior.
* Resolución de conflictos.
* Bloqueo de operaciones críticas sin conexión.
* Avisos claros al usuario.

29. Modelo de datos:
    Diseñar un esquema relacional completo en PostgreSQL que incluya al menos:

* companies
* warehouses
* zones
* aisles
* racks
* levels
* locations
* items
* item_packaging_units
* lots
* handling_units
* handling_unit_lines
* stock
* stock_reservations
* movements
* inbound_orders
* inbound_order_lines
* outbound_orders
* outbound_order_lines
* returns
* return_lines
* tasks
* incidents
* users
* roles
* permissions
* role_permissions
* api_tokens
* webhook_subscriptions
* webhook_delivery_logs
* audit_logs
* imports
* import_errors
* notifications
* inventory_counts
* inventory_count_lines

El modelo debe incluir claves primarias, claves foráneas, índices, restricciones únicas, timestamps, soft delete cuando proceda y tenant_id/company_id en todas las tablas necesarias.

30. Concurrencia y transacciones:
    Implementar:

* Transacciones atómicas en entradas, salidas, traslados, ajustes y reservas.
* Bloqueo de stock al reservar.
* Prevención de doble picking.
* Control de concurrencia.
* Rollback seguro si falla una operación.
* Idempotencia para endpoints críticos de integración.
* Idempotency-Key para llamadas externas.

31. Requisitos no funcionales:
    Definir y cumplir:

* API con respuesta media inferior a 300 ms en operaciones comunes.
* Listados paginados obligatorios.
* Soporte para miles de ubicaciones por almacén.
* Soporte para cientos de miles de movimientos históricos.
* Visor 3D optimizado mediante instancing o técnicas equivalentes.
* Logs estructurados.
* Health checks.
* Métricas.
* Backups.
* Restauración.
* Migraciones de base de datos.
* Separación de entornos: local, staging, producción.

32. Entregables esperados:
    Genera:

* Documento de arquitectura.
* Modelo entidad-relación.
* Esquema de base de datos.
* Migraciones.
* Backend API completo.
* Frontend completo.
* Visor 3D funcional.
* Sistema de autenticación.
* Roles y permisos.
* Seed inicial.
* Datos demo.
* Docker Compose.
* Documentación OpenAPI.
* README de instalación.
* README funcional.
* Tests unitarios básicos.
* Tests de integración para movimientos críticos.
* Colección Postman o equivalente.
* Scripts de backup/restauración básicos.

33. Criterios de aceptación:
    El sistema se considerará válido si:

* Permite crear una empresa, usuarios y roles.
* Permite crear un almacén completo con zonas, pasillos, racks, niveles y huecos.
* Permite crear artículos y lotes.
* Permite recibir mercancía y ubicarla manual o automáticamente.
* Actualiza stock correctamente.
* Permite reservar stock para un pedido.
* Genera tareas de picking.
* Permite confirmar picking mediante escaneo o entrada manual.
* Permite packing y expedición.
* Permite movimientos internos.
* Permite reposición.
* Permite inventario y ajustes justificados.
* Impide operaciones inválidas.
* Mantiene auditoría completa.
* Expone API REST documentada.
* Renderiza el almacén en 3D.
* Actualiza visualmente estados de ubicaciones.
* Genera informes y exportaciones.
* Respeta el aislamiento multiempresa.
* Funciona en Docker.
* Incluye datos demo para probar el sistema.

Quiero que desarrolles la solución de forma modular y profesional. Antes de implementar, presenta una propuesta técnica clara con arquitectura, entidades principales, endpoints, estructura de carpetas, modelo de permisos, estrategia de transacciones y estrategia de renderizado 3D. Después, entrega el código organizado por backend, frontend, base de datos, documentación y despliegue.
