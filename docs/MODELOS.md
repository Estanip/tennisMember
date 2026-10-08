# Modelos de datos

Fuente de verdad del schema: `apps/api/prisma/schema.prisma`.
Reglas de negocio del dominio: `docs/PRODUCT_CONTEXT.md`.

## User

Autenticación de acceso al backoffice.

| Campo | Notas |
| --- | --- |
| email | Único |
| username | Opcional; único si existe (login alternativo, 3-30 chars) |
| name | Nombre visible |
| passwordHash | bcrypt |
| role | `USER` \| `ADMIN` \| `SUPER_ADMIN` |

## Member (Socio)

| Campo | Notas |
| --- | --- |
| firstName | Obligatorio; editable |
| lastName | Obligatorio; editable |
| fullName | Derivado en API (`firstName` + `lastName`); no se persiste |
| memberId | Opcional; único si existe; id externo del socio en otra DB (columna SQL `member_id`) |
| email | Opcional; único si existe; si ya está seteado, solo `SUPER_ADMIN` puede cambiarlo o vaciarlo |
| dni | Obligatorio; único; 7–8 dígitos (ARG); editable |
| birthDate | Obligatorio; fecha calendario; editable |
| age / ageCategory | Derivados en API/UI (no columnas de negocio persistidas para categoría) |
| phone | Opcional en alta manual; obligatorio vía Google Form |
| condition | `SOCIO_REGULAR` \| `ABONADO_TENIS` |
| status | `0` No Habilitado · `1` Habilitado · `2` Pendiente · `3` Eliminado |
| deletedAt | Soft delete; set con status `3`; `null` al restablecer |
| deletedReason | `FALTA_DE_PAGO` · `BAJA_DE_SOCIO` · `OTRA` (solo si eliminado) |
| deletedReasonDetail | Texto libre; obligatorio si `deletedReason = OTRA` (máx. 500) |

Labels de UI para condición/estado/roles viven en `packages/shared`.

## MemberAuditLog (auditoría de socios)

Historial append-only de escrituras sobre socios (tabla `member_audit_log`). Se escribe en la **misma transacción** que el cambio del socio. No hay endpoint para editarlo ni borrarlo.

| Campo | Notas |
| --- | --- |
| memberId | Socio afectado (columna `member_id`; sin FK para que el historial no dependa del registro) |
| action | `CREATE` · `UPDATE` · `DELETE` (soft delete) · `RESTORE` (incluye reactivación vía alta/import de un eliminado) |
| source | `APP` (backoffice) · `GOOGLE_FORM` (webhook) · `IMPORT` (Excel) |
| actorUserId / actorName / actorEmail / actorRole | Usuario que hizo la acción, con copia de nombre/email/rol al momento; `null` en Google Form |
| before | Snapshot JSON de las columnas del socio antes de la acción; `null` en `CREATE` |
| after | Snapshot JSON después de la acción |
| changedFields | Campos que cambiaron (ignora `updatedAt`). Un `UPDATE` sin cambios efectivos no genera entrada |
| createdAt | Momento de la acción (columna `created_at`) |

Los snapshots contienen datos personales (DNI, email, teléfono): la consulta está restringida a `SUPER_ADMIN`.

## ErrorLog

Registro de errores del sistema (típicamente 5xx): message, stack, path, method, statusCode, userId, createdAt.
