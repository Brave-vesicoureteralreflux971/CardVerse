# Docker Deployment

This setup builds a single container image that contains:

- NestJS API
- `admin-web` static files
- `storefront-web` static files
- Caddy as the front-facing reverse proxy

Route layout:

- `/` -> `storefront-web`
- `/admin/` -> `admin-web`
- `/api/` -> NestJS backend
- `/uploads/` -> uploaded files from NestJS
- `/api/docs` -> Swagger

## Environment variables

Required database variables at container startup:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Common optional variables:

- `APP_PORT`: host port mapped to container `80`. Default `80`.
- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_EMAIL`
- `JWT_SECRET`
- `RUN_DB_PUSH`: whether to run `prisma db push` on startup. Default `true`.
- `RUN_DB_SEED`: whether to run `prisma seed` on startup. Default `true`.

## Build and run

Create an env file first, or pass variables inline.

Example `.env`:

```bash
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=cardverse
DB_PASSWORD=strong-password
DB_NAME=cardverse
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=JenkinWoo123!
DEFAULT_ADMIN_EMAIL=admin@example.com
JWT_SECRET=change-this-secret
RUN_DB_PUSH=true
RUN_DB_SEED=true
```

Start:

```bash
docker compose up -d --build
```

Or pass variables inline from the shell.

Bash:

```bash
DB_HOST=your-mysql-host \
DB_PORT=3306 \
DB_USER=cardverse \
DB_PASSWORD=strong-password \
DB_NAME=cardverse \
docker compose up -d --build
```

PowerShell:

```powershell
$env:DB_HOST='your-mysql-host'
$env:DB_PORT='3306'
$env:DB_USER='cardverse'
$env:DB_PASSWORD='strong-password'
$env:DB_NAME='cardverse'
docker compose up -d --build
```

## Direct docker build/run

Build:

```bash
docker build -f docker/app.Dockerfile -t cardverse:latest .
```

Run:

```bash
docker run -d \
  --name cardverse-app \
  -p 80:80 \
  -v cardverse_uploads:/app/uploads \
  -e DB_HOST=your-mysql-host \
  -e DB_PORT=3306 \
  -e DB_USER=cardverse \
  -e DB_PASSWORD=strong-password \
  -e DB_NAME=cardverse \
  -e JWT_SECRET=change-this-secret \
  cardverse:latest
```

## Notes

- Uploaded files are stored in the Docker volume `uploads_data` or `cardverse_uploads`.
- If your schema is already managed elsewhere, set `RUN_DB_PUSH=false`.
- If you do not want default admin reseeding on each start, set `RUN_DB_SEED=false`.
