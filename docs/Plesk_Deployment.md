# Despliegue en Plesk

Panel: **Plesk** — Servidor: `212.227.159.27`

## URLs de producción

| Servicio | URL |
|---|---|
| Frontend | `https://sga.iaragon.com` |
| Backend API | `https://api-sga.iaragon.com` |
| Swagger docs | `https://api-sga.iaragon.com/api/docs` |

## Arquitectura

- **Frontend** (`sga.iaragon.com`): build estático de Vite/React servido por Apache. Directorio: `/var/www/vhosts/iaragon.com/sga/frontend/`
- **Backend** (`api-sga.iaragon.com`): NestJS corriendo como app Node.js en Plesk (Phusion Passenger). Directorio: `/var/www/vhosts/iaragon.com/api-sga/backend/`
- **Base de datos**: PostgreSQL `sga_db` en el mismo servidor (`127.0.0.1:5432`), usuario `sgasa`

## 1. Base de datos PostgreSQL

En Plesk > **Bases de datos** > Agregar base de datos:
1. Motor: **PostgreSQL**
2. Nombre: `sga_db`
3. Usuario con todos los privilegios (ej. `sgasa`)
4. En caso de problemas de autenticación, forzar contraseña via SSH:
   ```bash
   su - postgres -c "psql -c \"ALTER USER sgasa WITH PASSWORD 'SgaPass2024';\""
   ```
5. Verificar que `pg_hba.conf` use `md5` (no `scram-sha-256`) para conexiones TCP locales y recargar:
   ```bash
   su - postgres -c "psql -c 'SELECT pg_reload_conf();'"
   ```

## 2. DNS

Añadir registros A en la zona DNS de `iaragon.com` (en Plesk > `iaragon.com` > DNS):

| Nombre | Tipo | Valor |
|---|---|---|
| `sga` | A | `212.227.159.27` |
| `api-sga` | A | `212.227.159.27` |

## 3. Subdominios en Plesk

En `iaragon.com` > **Añadir subdominio**:

| Subdominio | Raíz del documento |
|---|---|
| `sga` | `sga/frontend` |
| `api-sga` | `api-sga/backend` |

## 4. SSL

Para cada subdominio, ir a **SSL/TLS Certificates** > **Let's Encrypt** > emitir.
Los DNS deben propagarse antes (verificar con `nslookup sga.iaragon.com 8.8.8.8`).

## 5. Backend: configuración Node.js

En `api-sga.iaragon.com` > **Node.js**:
- **Raíz de la aplicación**: `/api-sga/backend`
- **Archivo de inicio**: `dist/main.js`
- **Modo**: `production`
- Pulsar **Activar Node.js**

### Archivo `.env` en el servidor

Crear en `/var/www/vhosts/iaragon.com/api-sga/backend/.env`:
```
DATABASE_URL="postgresql://sgasa:SgaPass2024@127.0.0.1:5432/sga_db?schema=public"
JWT_SECRET="49ee642cbd5d514092e1e6ca8511642ca6f96de4cd3b9cd1d3f753173cd67a71"
JWT_EXPIRES_IN="8h"
CORS_ORIGIN="https://sga.iaragon.com"
NODE_ENV="production"
```
> No definir `PORT` — Passenger lo asigna automáticamente.

### Migración y seed de base de datos (primera vez)

```bash
cd /var/www/vhosts/iaragon.com/api-sga/backend
DATABASE_URL="postgresql://sgasa:SgaPass2024@127.0.0.1:5432/sga_db?schema=public" \
  ./node_modules/.bin/prisma db push
./node_modules/.bin/prisma db seed
```

## 6. Frontend: build y despliegue

En la máquina local:
```bash
cd frontend
# Crear frontend/.env.production
echo "VITE_API_URL=https://api-sga.iaragon.com/api/v1" > .env.production
npm run build
```
Subir el contenido de `frontend/dist/` al servidor:
```bash
pscp -r frontend/dist/* root@212.227.159.27:/var/www/vhosts/iaragon.com/sga/frontend/
```

## 7. CORS — configuración Apache

Crear `/var/www/vhosts/system/api-sga.iaragon.com/conf/vhost_ssl.conf`:
```apache
<IfModule mod_headers.c>
  Header always set Access-Control-Allow-Origin "https://sga.iaragon.com"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Authorization, Content-Type, Accept"
  Header always set Access-Control-Allow-Credentials "true"
  Header always set Access-Control-Max-Age "3600"
</IfModule>
```

> **Importante**: el directorio del backend **no debe tener `.htaccess`** con cabeceras CORS — Apache lo procesaría antes que `vhost_ssl.conf` y sobreescribiría los valores.

## 8. Despliegues posteriores

### Actualizar backend
```bash
# En el servidor (SSH)
cd /var/www/vhosts/iaragon.com/api-sga/backend
git pull
npm run build
touch tmp/restart.txt   # reinicia Passenger
```

### Actualizar frontend
```bash
# En local
cd frontend
npm run build
pscp -r dist/* root@212.227.159.27:/var/www/vhosts/iaragon.com/sga/frontend/
```

## 9. Verificación

```bash
# Preflight CORS (debe devolver 204 con Access-Control-Allow-Origin: https://sga.iaragon.com)
curl -v -X OPTIONS "https://api-sga.iaragon.com/api/v1/auth/login" \
  -H "Origin: https://sga.iaragon.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, content-type"

# Login (debe devolver token JWT)
curl -X POST "https://api-sga.iaragon.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sga.com","password":"Admin123!"}'
```

## Notas técnicas

- El proyecto usa `prisma db push` (no `prisma migrate`). No existe carpeta `migrations/`.
- Cualquier cambio de variables de entorno requiere tocar `tmp/restart.txt` o reiniciar desde Plesk.
- El backend incluye un middleware Express que responde a OPTIONS antes de cualquier guard de NestJS, evitando que el preflight CORS devuelva 428.
- Los dominios `.plesk.page` son "dominios técnicos" de Plesk — los navegadores interceptan las peticiones XHR con un aviso de cookie que impide el CORS. Usar siempre dominios reales en producción.
