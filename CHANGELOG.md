# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Rol `SUPER_ADMIN` y gestión de usuarios del backoffice (`/users`, API `GET|POST|PATCH /api/users`)
- Helpers de permisos en `@socios/shared` (`canManageMembers`, `canManageUsers`)
- Seed: `superadmin@alem.com` (SUPER_ADMIN)
- Username opcional y único en usuarios; login con email o username (`identifier`)
- `memberId` opcional y único en socios (columna SQL `member_id`; id externo de otra DB)
- Export/import de socios en Excel (`.xlsx`) con plantilla fija y resumen de omitidos/reactivados
- Google Form: alta de abonado en estado **Habilitado** (antes Pendiente)
- Email de socio opcional (`null` permitido; único si existe) y editable tras el alta

### Changed

- Web: topbar y layout mobile sin scroll horizontal (marca corta, nav en 2 filas, usuario oculto en pantallas chicas)
- Railway: builder `NIXPACKS` → `RAILPACK` en `railway.api.toml` y `railway.web.toml`
- Railway: `YARN_PRODUCTION=false` en build para no omitir `devDependencies` bajo `NODE_ENV=production`
- API: `typescript` y `@types/node` pasan a `dependencies` (necesarios para `tsc` en Railway)
- API: logs de errores Prisma/Postgres más explícitos (código, tabla/columna, hint; p. ej. P2022)
- CI/`yarn typecheck` y `yarn build`: generan `@socios/shared` + Prisma Client antes de `tsc`
- Protocolo del agente: validar lint/typecheck/build (y impacto Railway) antes de pushear; commits sin co-autoría de IA
- Railway API: `releaseCommand` (inválido) → `preDeployCommand` + migrate en `startCommand` para aplicar schema (fix P2022)

### Added

- Monorepo inicial (`apps/api`, `apps/web`, `packages/shared`)
- API Fastify 5 con auth JWT, Swagger, rate limit y CRUD de socios (soft delete)
- Frontend Next.js 16 con login, listado (búsqueda/filtros/paginación), alta y edición
- Roles `ADMIN` (escritura) y `USER` (solo lectura)
- Seed local `admin@alem.com` / `Alem1916`
- Documentación de producto, conceptos, DB y deployment
- Separación de reglas del agente: `.cursorrules` genérico + docs específicos (`STACK`, `ARQUITECTURA`, `BACKEND`, `FRONTEND`, `MODELOS`)
- Estado de socio `Pendiente` (`2`) y webhook `POST /api/webhooks/google-form` (Apps Script + ngrok)
- Documentación e integración de Google Form (`docs/GOOGLE_FORM.md`, `integrations/google-form/Code.gs`)
- Collection Postman + environments Local/Test/Production (`docs/postman/`)
- Variables de entorno documentadas y plantillas por servicio (API, Web, Docker Compose)
- CI GitHub Actions (lint, typecheck, build) y configs Railway test (`railway.api.toml`, `railway.web.toml`)
- Guía de deploy test en Railway (`docs/DEPLOYMENT.md`)
- Modo claro / oscuro en el backoffice web (preferencia en `localStorage`)
- Paleta primary/badges/acentos en azul `#2B7FFF` (claro y oscuro)
- Teléfono de socio opcional; si se informa, exactamente 10 dígitos (sin 0 ni 15)
- UI web alineada a CourtBook admin (paleta, tipografías, tema claro/oscuro/sistema)
- Validaciones de socio: nombre 2–80, email válido, edad 0–100
- Alerta por email al admin (`ADMIN_ALERT_EMAIL` / Resend) al crear socio (app o Google Form); fallo de mail no bloquea el alta
- El alta no espera el envío del mail (fire-and-forget); Resend con timeout de 10s
- Campo obligatorio `dni` (ARG, 7–8 dígitos, único) en padrón, forms, Google Form y API
- `birthDate` en DB; edad y Categoría (Menor &lt; 14 / Adulto) derivadas; Google Form envía fecha `dd/mm/aaaa`
- Nombre y apellido separados (`firstName` / `lastName`); `fullName` derivado en la API
- Logger Pino con niveles (`LOG_LEVEL`), JSON para plataformas o pretty con color/emoji (`LOG_PRETTY`)
- Logs de monitoreo en auth, members, webhook Google Form y email (info/warn/error/debug)
- Google Form Apps Script: alias de teléfono (`Teléfono` / `NUMERO DE TELEFONO`, etc.)
- Edición de socio: todos los campos editables excepto email
- Soft delete con status `3` (Eliminado) + `deletedAt`; filtro y restablecer a Habilitado
- Motivo de baja al eliminar: `FALTA_DE_PAGO` | `BAJA_DE_SOCIO` | `OTRA` (+ detalle obligatorio si Otra); se limpia al restablecer
