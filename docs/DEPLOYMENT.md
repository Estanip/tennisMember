# Deployment

## Requisitos

- Node.js >= 20
- Yarn 1.x
- Docker (Postgres local)

## Scripts principales

| Comando | Descripción |
| --- | --- |
| `yarn install` | Instalar dependencias del monorepo |
| `docker compose up -d` | Postgres local |
| `yarn db:migrate` | Migraciones Prisma (dev) |
| `yarn db:migrate:deploy` | Migraciones Prisma (deploy / CI / Railway) |
| `yarn db:seed` | Seed de usuarios |
| `yarn dev:api` | API (puerto desde `apps/api/.env` → `PORT`) |
| `yarn dev:web` | Web (puerto desde `apps/web/.env.local` → `PORT`) |
| `yarn build` / `yarn build:api` / `yarn build:web` | Builds |
| `yarn start:api` / `yarn start:web` | Start de producción |
| `yarn format` / `yarn lint` / `yarn typecheck` | Calidad |

## Variables de entorno (local)

Cada servicio tiene su propio archivo. Los `*.example` están versionados; copiar y completar.

| Archivo | Ambiente | Qué configura |
| --- | --- | --- |
| `.env` (raíz) | Local | Postgres de Docker Compose (`POSTGRES_*`) |
| `apps/api/.env` | Local | API: `PORT`, `HOST`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, webhook |
| `apps/api/.env.development` | Development / test remoto | Misma forma (ver `.env.development.example`) |
| `apps/api/.env.production` | Production | Misma forma (ver `.env.production.example`) |
| `apps/web/.env.local` | Local | Web: `PORT`, `NEXT_PUBLIC_API_URL` |

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Defaults locales: API `:3003`, Web `:3004`, Postgres `:5432`.

## Ambientes

| Ambiente | Hosting | Base de datos |
| --- | --- | --- |
| Local | Máquina local | Docker Compose / Postgres local |
| Test | Railway | Postgres plugin de Railway |
| Production | (pendiente) | (pendiente) |

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

- Trigger: push/PR a `main` o `master`
- Pasos: `yarn install` → `yarn lint` → `yarn typecheck` → `yarn build`
- Deploy: **no** está en Actions; Railway despliega al conectar el repo en el dashboard

## Railway (ambiente test)

Repo: `Estanip/tennisMember` (privado).

### Servicios a crear

1. **Postgres** (plugin Railway) → genera `DATABASE_URL`
2. **api** (from GitHub repo)
3. **web** (from GitHub repo)

Root Directory de ambos services de app: `/` (raíz del monorepo).

### Config files

| Service | Archivo en el repo |
| --- | --- |
| api | `railway.api.toml` |
| web | `railway.web.toml` |

En cada service: Settings → Config-as-code → path al archivo correspondiente  
**o** pegá a mano:

**api**

- Build: `yarn install --frozen-lockfile && yarn build:api`
- Start: `yarn start:api`
- Release: `yarn db:migrate:deploy` (corre automáticamente en cada deploy del service `api` vía `releaseCommand` en `railway.api.toml`)
- Healthcheck: `/health`

**web**

- Build: `yarn install --frozen-lockfile && yarn build:web`
- Start: `yarn start:web`
- Healthcheck: `/`

### Variables — service `api`

| Variable | Notas |
| --- | --- |
| `DATABASE_URL` | Referencia al plugin Postgres (Variable Reference) |
| `JWT_SECRET` | Secret fuerte, único de test |
| `CORS_ORIGIN` | URL pública del service `web` (ej. `https://web-xxxx.up.railway.app`) |
| `GOOGLE_FORM_WEBHOOK_SECRET` | Secret de test; actualizar Apps Script |
| `HOST` | `0.0.0.0` |
| `NODE_ENV` | `production` |
| `ADMIN_ALERT_EMAIL` | Destino de alertas (nuevo socio) |
| `EMAIL_PROVIDER` | `resend` (o `console` para logs) |
| `EMAIL_FROM` | Remitente verificado en Resend |
| `RESEND_API_KEY` | API key de Resend |
| `PORT` | Lo inyecta Railway (no definir a mano) |

### Variables — service `web`

| Variable | Notas |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<api-public-url>/api` — **requerida en build** |
| `PORT` | Lo inyecta Railway |

Orden sugerido:

1. Crear Postgres + api + web y primer deploy.
2. Copiar URL pública de api → setear `NEXT_PUBLIC_API_URL` en web → redeploy web.
3. Copiar URL pública de web → setear `CORS_ORIGIN` en api → redeploy api.
4. Seed opcional (one-off): `yarn db:seed` con `DATABASE_URL` de test.
5. Actualizar Google Form Apps Script `WEBHOOK_URL` a `https://<api>/api/webhooks/google-form` (sin ngrok).

### Postman

Environment **Test** en `docs/postman/`: actualizar `baseUrl` a la URL pública de la API cuando exista.

## Swagger local

`http://localhost:3003/docs` (si `PORT=3003`).
