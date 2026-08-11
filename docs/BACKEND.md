# Backend

Aplicación: `apps/api` (Fastify 5.x).

## API response (estándar)

- Success: `{ success: true, data?: T, message?: string }`
- Error: `{ success: false, error?: string, message?: string }`

## Swagger

- Obligatorio con `@fastify/swagger` y `@fastify/swagger-ui` en desarrollo.
- En `NODE_ENV=production` **no** se monta `/docs` (salvo `ENABLE_SWAGGER=true`).
- **CRÍTICO (Fastify 5.x)**: declarar **todas** las propiedades explícitamente en schemas para evitar filtrado de datos en responses.
- Campos opcionales/nullable: `type: ["object", "null"]` (o el par de tipos que corresponda).

## Autenticación y autorización

- JWT con `@fastify/jwt` y hash de passwords con `bcryptjs`.
- Tokens con expiración (`JWT_EXPIRES_IN`, default **12h**).
- En producción: `JWT_SECRET` obligatorio, ≥ 32 caracteres y sin placeholders (`change-me` / `local-dev`); la API no arranca si es inválido.
- En cada request autenticado se **revalida el usuario en DB** (existencia + rol/email/nombre actuales); un JWT con rol viejo o usuario borrado queda inválido.
- Middleware:
  - `authenticate` — usuario autenticado
  - `requireMemberWrite` — rol `ADMIN` o `SUPER_ADMIN` (escritura de socios)
  - `requireSuperAdmin` — rol `SUPER_ADMIN` (gestión de usuarios)
  - `requireAdmin` — alias de `requireMemberWrite` (deprecated)
- Roles: `USER` (lectura) / `ADMIN` (escritura socios) / `SUPER_ADMIN` (usuarios + socios). Ver `PRODUCT_CONTEXT.md`.

## Rate limiting

- Global (`@fastify/rate-limit`): máx. **100** requests / **15** minutos.
- `POST /api/auth/login`: máx. **10** intentos / **15** minutos por IP.
- `@fastify/helmet`: headers de seguridad HTTP en la API (CSP desactivado; la UI es Next).

## Webhook Google Form

- Header `X-Webhook-Secret` comparado con `GOOGLE_FORM_WEBHOOK_SECRET` de forma **timing-safe**.

## Logging

- Librería: **Pino** (integrada con Fastify).
- Niveles: `fatal` | `error` | `warn` | `info` | `debug` | `trace` vía `LOG_LEVEL`.
- Formato:
  - `LOG_PRETTY=true` (default local): salida coloreada con emoji por nivel.
  - `LOG_PRETTY=false` (default en `production`): **JSON por línea** (Grafana Loki, Better Stack, Elastic).
- Campos base: `service`, `env`, `level`, `time` (ISO), `msg`, `emoji`, y bindings (`module`, `req`, `err`, etc.).
- Helper: `getLogger("module")` en `apps/api/src/lib/logger.ts`.
- Secrets redactados: `Authorization`, `X-Webhook-Secret`.

## Errores

- Error handler global (4xx → `warn`, 5xx → `error` + persistencia).
- Errores 5xx persistidos en tabla `ErrorLog`.

## Prisma

- Schema en `apps/api/prisma/schema.prisma`.
- Config CLI en `apps/api/prisma.config.ts` (incl. seed; **no** usar `package.json#prisma`).
- Modelos: `docs/MODELOS.md`.
- Ambientes DB: `docs/DATABASE.md`.

## Endpoints MVP (socios)

- `POST /api/auth/login` — body `{ identifier, password }` (email o username)
- `GET /api/auth/me`
- `GET /api/members` (search, filtros, paginación) — autenticado
- `GET /api/members/export` — Excel `.xlsx` con filtros del listado
- `GET /api/members/import-template` — plantilla Excel (ADMIN)
- `POST /api/members/import` — multipart `.xlsx` (ADMIN); máx. **2000** filas; magic bytes + MIME; alta parcial + resumen de omitidos/reactivados
- `GET /api/members/:id` — autenticado
- `POST|PATCH|DELETE /api/members` — `ADMIN` o `SUPER_ADMIN` (DELETE = soft delete con motivo). En PATCH, si el socio ya tiene email, solo `SUPER_ADMIN` puede cambiarlo o vaciarlo (`403 EMAIL_LOCKED`)
- `GET|POST|PATCH /api/users` — solo `SUPER_ADMIN`
- `POST /api/webhooks/google-form` — secret `X-Webhook-Secret`; crea socio Habilitado (`condition` opcional: `ABONADO_TENIS` default | `SOCIO_REGULAR`)

Integración Google Form: `docs/GOOGLE_FORM.md`.

## Postman

Collection + environments (Local / Test / Production): `docs/postman/`.

Ver `docs/postman/README.md` para importar y el flujo de login → token.

## Variables de entorno

Plantilla local: `apps/api/.env.example`. Ambientes staging/prod: `.env.development.example` / `.env.production.example`.

Detalle completo: `docs/DEPLOYMENT.md`.
