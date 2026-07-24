# Backend

Aplicación: `apps/api` (Fastify 5.x).

## API response (estándar)

- Success: `{ success: true, data?: T, message?: string }`
- Error: `{ success: false, error?: string, message?: string }`

## Swagger

- Obligatorio con `@fastify/swagger` y `@fastify/swagger-ui`.
- **CRÍTICO (Fastify 5.x)**: declarar **todas** las propiedades explícitamente en schemas para evitar filtrado de datos en responses.
- Campos opcionales/nullable: `type: ["object", "null"]` (o el par de tipos que corresponda).

## Autenticación y autorización

- JWT con `@fastify/jwt` y hash de passwords con `bcryptjs`.
- Middleware:
  - `authenticate` — usuario autenticado
  - `requireAdmin` — rol `ADMIN`
- Roles: `ADMIN` (escritura) / `USER` (solo lectura). Detalle de negocio en `PRODUCT_CONTEXT.md`.

## Rate limiting

- `@fastify/rate-limit`: máx. **100** requests / **15** minutos.

## Errores

- Error handler global.
- Errores 5xx persistidos en tabla `ErrorLog`.

## Prisma

- Schema en `apps/api/prisma/schema.prisma`.
- Config CLI en `apps/api/prisma.config.ts` (incl. seed; **no** usar `package.json#prisma`).
- Modelos: `docs/MODELOS.md`.
- Ambientes DB: `docs/DATABASE.md`.

## Endpoints MVP (socios)

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/members` (search, filtros, paginación) — autenticado
- `GET /api/members/:id` — autenticado
- `POST|PATCH|DELETE /api/members` — solo `ADMIN` (DELETE = soft delete)
- `POST /api/webhooks/google-form` — secret `X-Webhook-Secret`; crea Abonado Tenis en estado Pendiente

Integración Google Form: `docs/GOOGLE_FORM.md`.

## Postman

Collection + environments (Local / Test / Production): `docs/postman/`.

Ver `docs/postman/README.md` para importar y el flujo de login → token.

## Variables de entorno

Plantilla local: `apps/api/.env.example`. Ambientes staging/prod: `.env.development.example` / `.env.production.example`.

Detalle completo: `docs/DEPLOYMENT.md`.
