# Socios Backoffice (tennisMember)

Backoffice para gestión de socios de un club de tenis.

## Stack

Ver [`docs/STACK.md`](./docs/STACK.md). Resumen: Yarn monorepo · Fastify 5 · Next.js 16 · Prisma/PostgreSQL · JWT.

## Setup rápido (local)

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
yarn install
docker compose up -d   # o usá tu Postgres local y ajustá DATABASE_URL
yarn workspace @socios/shared build
yarn db:migrate
yarn db:seed
```

En dos terminales:

```bash
yarn dev:api
yarn dev:web
```

- Web: http://localhost:3004
- API / Swagger: http://localhost:3003/docs

### Credenciales seed

- Admin: `admin@alem.com` / `Alem1916`
- User (solo lectura): `user@alem.com` / `User1916`

## Ambiente test (Railway)

Hosting: **Railway** (API + Web + Postgres). CI de calidad en GitHub Actions; el deploy se conecta desde el dashboard de Railway al repo.

Guía completa (servicios, comandos, variables): [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

### Variables Railway (resumen)

**api:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `GOOGLE_FORM_WEBHOOK_SECRET`, `HOST=0.0.0.0`  
**web:** `NEXT_PUBLIC_API_URL` (build-time, `https://<api>/api`)

Configs de ejemplo: `railway.api.toml`, `railway.web.toml`.

## Postman

Collection y environments: [`docs/postman/`](./docs/postman/).

## Documentación

| Documento | Uso |
| --- | --- |
| [`.cursorrules`](./.cursorrules) | Reglas genéricas del agente |
| [`docs/PRODUCT_CONTEXT.md`](./docs/PRODUCT_CONTEXT.md) | Producto y reglas de negocio |
| [`docs/STACK.md`](./docs/STACK.md) | Tech stack |
| [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) | Arquitectura |
| [`docs/BACKEND.md`](./docs/BACKEND.md) | Convenciones API |
| [`docs/FRONTEND.md`](./docs/FRONTEND.md) | Convenciones UI |
| [`docs/MODELOS.md`](./docs/MODELOS.md) | Modelos de datos |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | DB por ambiente |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Scripts, CI y Railway |
| [`docs/CONCEPTOS.md`](./docs/CONCEPTOS.md) | Glosario |
| [`docs/GOOGLE_FORM.md`](./docs/GOOGLE_FORM.md) | Webhook Google Form |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historial de cambios |
