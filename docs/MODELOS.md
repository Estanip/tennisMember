# Modelos de datos

Fuente de verdad del schema: `apps/api/prisma/schema.prisma`.
Reglas de negocio del dominio: `docs/PRODUCT_CONTEXT.md`.

## User

Autenticación de acceso al backoffice.

| Campo | Notas |
| --- | --- |
| email | Único |
| name | Nombre visible |
| passwordHash | bcrypt |
| role | `ADMIN` \| `USER` |

## Member (Socio)

| Campo | Notas |
| --- | --- |
| fullName | Obligatorio; editable |
| email | Obligatorio; único; **no editable** tras el alta |
| age | Entero; obligatorio; editable |
| phone | Opcional en alta manual; obligatorio vía Google Form |
| condition | `SOCIO_REGULAR` \| `ABONADO_TENIS` |
| status | `0` No Habilitado · `1` Habilitado · `2` Pendiente · `3` Eliminado |
| deletedAt | Soft delete; set con status `3`; `null` al restablecer |
| deletedReason | `FALTA_DE_PAGO` · `BAJA_DE_SOCIO` · `OTRA` (solo si eliminado) |
| deletedReasonDetail | Texto libre; obligatorio si `deletedReason = OTRA` (máx. 500) |

Labels de UI para condición/estado/roles viven en `packages/shared`.

## ErrorLog

Registro de errores del sistema (típicamente 5xx): message, stack, path, method, statusCode, userId, createdAt.
