# Stack técnico

## Monorepo

- Gestor de paquetes: **Yarn** exclusivamente (workspaces).
- Packages:
  - `apps/api` — backend
  - `apps/web` — frontend
  - `packages/shared` — tipos/constantes compartidos Frontend ↔ Backend

## Runtime y frameworks

| Capa | Tecnología |
| --- | --- |
| Backend | Fastify 5.x |
| Frontend | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript estricto |
| ORM / DB | Prisma + PostgreSQL (Supabase en development/production) |
| Auth | JWT (`@fastify/jwt`) + `bcryptjs` + revalidación DB |
| Security headers | `@fastify/helmet` (API) |

## Tooling de calidad

- **Biome**: format + lint (`noExplicitAny: error`)
- **Husky**:
  - Pre-commit: `yarn format` + `yarn lint` + `yarn typecheck`
  - Commitlint: Conventional Commits (scope opcional)
- Scripts raíz: ver `docs/DEPLOYMENT.md`

## Versiones

Preferir siempre las **últimas versiones estables** de Fastify, Next.js y React al scaffoldear o actualizar.
