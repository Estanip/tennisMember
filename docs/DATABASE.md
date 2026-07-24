# Base de datos

## Local

1. Copiar env de Postgres (raíz) si no existe: `cp .env.example .env`
2. Levantar Postgres: `docker compose up -d`
3. Copiar env de API: `cp apps/api/.env.example apps/api/.env`
4. Migrar: `yarn db:migrate`
5. Seed: `yarn db:seed`

Credenciales seed:

- Admin: `admin@alem.com` / `Alem1916`
- User (solo lectura): `user@alem.com` / `User1916`

`DATABASE_URL` local por defecto (alineado a `docker-compose` / `.env`):

```env
DATABASE_URL="postgresql://socios:socios@localhost:5432/socios?schema=public"
```

Si cambiás `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` o `POSTGRES_PORT` en la raíz, actualizá `DATABASE_URL` en `apps/api/.env` en consecuencia.

## Development / Production / Test remoto

1. Copiar plantilla:
   - `cp apps/api/.env.development.example apps/api/.env.development`
   - o `cp apps/api/.env.production.example apps/api/.env.production`
2. Completar `DATABASE_URL` (Railway Postgres en test, u otro proveedor) y secrets.
3. En deploy: `yarn db:migrate:deploy` (Railway lo corre como release command del service api).

Detalle Railway: `docs/DEPLOYMENT.md`.
