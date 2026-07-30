# Despliegue en Plesk

Panel real usado: **Plesk** (no cPanel). Suscripción: `eager-diffie.212-227-159-27.plesk.page`.

Arquitectura: el frontend (build estático de Vite) se sirve en la raíz de
`https://eager-diffie.212-227-159-27.plesk.page`, y el backend (NestJS) corre como app Node.js
de Plesk en el subdominio `https://api.eager-diffie.212-227-159-27.plesk.page`.

## 1. Subdominio para la API

En la suscripción `eager-diffie.212-227-159-27.plesk.page` > pestaña **Hosting y DNS** (o
**Dominios** > Agregar subdominio), crea el subdominio `api`, quedando
`api.eager-diffie.212-227-159-27.plesk.page`. Plesk le asigna su propio directorio (algo como
`api.eager-diffie.212-227-159-27.plesk.page/httpdocs`) y crea el registro DNS solo, dentro de
la misma zona.

## 2. Base de datos PostgreSQL

En la suscripción > **Bases de datos** > Agregar base de datos:
1. Motor: **PostgreSQL**.
2. Nombre de la base (ej. `sga_db`).
3. Crea un usuario de base de datos con todos los privilegios sobre ella.
4. Anota host (normalmente `localhost`), puerto (`5432` salvo que Plesk use
   otro por defecto — confírmalo en la propia pantalla de la base), nombre de
   base y usuario/contraseña.

## 3. Backend: app Node.js en el subdominio `api`

Entra al subdominio `api.eager-diffie.212-227-159-27.plesk.page` y abre su herramienta
**Node.js**:
1. **Activar Node.js** para ese subdominio.
2. **Versión de Node.js**: la más reciente disponible (18+).
3. **Modo de la aplicación**: Production.
4. **Raíz del documento / Application root**: la carpeta del subdominio
   (donde subirás el código del backend).
5. **Application startup file**: `dist/main.js`.
6. **Variables de entorno** (sección de la misma herramienta Node.js):
   - `DATABASE_URL="postgresql://sga_sa:PASSWORD@localhost:5432/sga_db?schema=public"`
   - `JWT_SECRET="..."` (cadena aleatoria larga)
   - `JWT_EXPIRES_IN="8h"`
   - `CORS_ORIGIN="https://eager-diffie.212-227-159-27.plesk.page"`
   - `NODE_ENV=production`
   - (No definas `PORT`; Plesk/Passenger lo asigna solo.)

7. Sube el código de `backend/` a la carpeta configurada (vía **Git** —
   Plesk trae esa extensión y permite push-to-deploy —, o subiendo un zip por
   **Archivos** y extrayéndolo ahí).

8. En la herramienta Node.js de Plesk hay un botón **Ejecutar NPM install**
   (dispara `npm install`, que a su vez corre el `postinstall: prisma
   generate` ya configurado). Después necesitas correr manualmente, desde la
   consola SSH de la suscripción (o el botón de terminal de Plesk si lo
   ofrece tu plan):
   ```bash
   npm run build      # nest build -> genera dist/
   npx prisma db push # aplica el schema contra la base de datos de producción
   ```

9. Vuelve a la herramienta Node.js y pulsa **Reiniciar app**.

## 4. Frontend: build y subida

En tu máquina local:
```bash
cd frontend
VITE_API_URL="https://api.eager-diffie.212-227-159-27.plesk.page/api/v1" npm run build
```
Esto genera `frontend/dist/` (incluye el `.htaccess` de `frontend/public/`
copiado automáticamente por Vite — Plesk usa Apache/nginx por debajo, así que
las reglas de rewrite del `.htaccess` aplican igual que en cPanel).

Sube el **contenido** de `frontend/dist/` (no la carpeta en sí) al
`httpdocs` de la suscripción raíz `eager-diffie.212-227-159-27.plesk.page`, vía **Archivos**
o Git.

## 5. SSL

En la suscripción > **Certificados SSL/TLS**, emite Let's Encrypt para
`eager-diffie.212-227-159-27.plesk.page` y por separado (o como SAN del mismo certificado)
para `api.eager-diffie.212-227-159-27.plesk.page`.

## 6. Verificación

- `https://api.eager-diffie.212-227-159-27.plesk.page/api/v1` responde (aunque sea 404 de
  ruta raíz no definida, confirma que el proceso Node está vivo).
- `https://api.eager-diffie.212-227-159-27.plesk.page/api/docs` abre el Swagger.
- `https://eager-diffie.212-227-159-27.plesk.page` carga el frontend, el login funciona, y
  al recargar una ruta interna (ej. `/dashboard`) no da 404.
- Tras expirar el access token, el refresh automático funciona sin errores
  de CORS en la consola del navegador.

## Notas

- El proyecto no usa `prisma migrate` (no existe `backend/prisma/migrations/`,
  está en `.gitignore`). El despliegue usa `prisma db push`, igual que en
  desarrollo.
- Cualquier cambio de código o de variables de entorno requiere **Reiniciar
  app** manual desde la herramienta Node.js de Plesk.
- Plesk trae Docker como extensión nativa (visible en el panel), a diferencia
  de cPanel. No se usa en este plan porque ya se optó por la app Node.js
  nativa de Plesk (más simple, con SSL integrado), pero queda como opción si
  más adelante se prefiere containerizar.
