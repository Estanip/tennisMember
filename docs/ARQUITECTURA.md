# Arquitectura

## Visión

Backoffice de un único club de tenis: padrón centralizado de socios con autenticación restringida y autorización por roles.

## Estructura del monorepo

```text
apps/
  api/          # Fastify — HTTP, auth, persistencia, Swagger
  web/          # Next.js App Router — UI del backoffice
packages/
  shared/       # Contratos TypeScript (tipos, enums, labels)
```

## Principios de diseño

- **Separación de responsabilidades**: rutas → servicios → Prisma; UI → context/api client → API.
- **Contrato compartido**: tipos y constantes de dominio en `@socios/shared` (evitar duplicar enums/labels).
- **Single club**: no hay multi-tenant ni multi-club.
- **SOLID / Clean Code** en todas las capas (ver `.cursor/rules/`).

## Límites

- El frontend no accede a la DB; solo habla con la API vía `apiClient`.
- El backend es la fuente de verdad de permisos (`authenticate` / `requireAdmin`).
- Soft delete de socios: `status = 3` + `deletedAt` + motivo (`deletedReason` / `deletedReasonDetail`); listado filtrable; restore limpia motivo y `deletedAt` y pone status `1`.

## Referencias

- Stack: `docs/STACK.md`
- Backend: `docs/BACKEND.md`
- Frontend: `docs/FRONTEND.md`
- Modelos: `docs/MODELOS.md`
- Negocio: `PRODUCT_CONTEXT.md`
