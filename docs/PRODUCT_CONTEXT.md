# PRODUCT CONTEXT — Socios Backoffice

## Visión

Aplicación web/mobile para la gestión de socios de un club de tenis. El sistema permite mantener un padrón centralizado de socios, con autenticación restringida y administración por roles.

## Objetivo

Proveer un backoffice simple y confiable para:

- Iniciar sesión (solo usuarios existentes; sin registro público).
- Consultar socios (todos los roles autenticados).
- Crear y editar socios (solo administradores).
- Recibir solicitudes de alta de abono desde Google Form (aspirantes públicos) en estado Pendiente.

## Autenticación y roles

- **Login únicamente**: no existe flujo de registro de nuevos usuarios desde la aplicación.
- Los usuarios de acceso se dan de alta por fuera del flujo público (p. ej. seed, operación interna o bootstrap).
- Roles:
  - **ADMIN**: puede crear y editar socios.
  - **USER**: puede consultar el padrón (solo lectura); no puede crear ni editar.

## Modelo de dominio: Socio

Cada socio pertenece al club y tiene las siguientes propiedades:

| Propiedad          | Descripción                       | Reglas                                                         |
| ------------------ | --------------------------------- | -------------------------------------------------------------- |
| Nombre Completo    | Nombre y apellido del socio       | Obligatorio; editable                                          |
| Email              | Identificador único del socio     | Obligatorio; único; **no editable** tras el alta               |
| Edad               | Edad del socio (número)           | Obligatoria; editable                                          |
| Número de teléfono | Contacto telefónico               | Opcional en alta manual; obligatorio en solicitudes Google Form |
| Condición          | Tipo de membresía                 | `Socio Regular` \| `Abonado Tenis`                             |
| Estado             | Habilitación del socio en el club | DB: `0` No Habilitado · `1` Habilitado · `2` Pendiente         |

### Condición

- **Socio Regular**: socio del club sin abono específico de tenis.
- **Abonado Tenis**: socio con abono de tenis.

### Estado

- **No Habilitado (`0`)**: el socio no está habilitado.
- **Habilitado (`1`)**: el socio está activo / habilitado en el club.
- **Pendiente (`2`)**: solicitud recibida (p. ej. Google Form); el admin debe revisar y aprobar/cambiar estado.

### Baja

- Soft delete (`deletedAt`): el socio deja de aparecer en el padrón activo sin borrarse de la base.

## Google Form (solicitudes públicas)

Form de referencia: [SOLICITUD ALTA DE ABONO - TENIS CALNA](https://docs.google.com/forms/d/e/1FAIpQLSfv6WHsFZCK5f-HV_ydRpRYugTURbPVzbJczD9OD5HLbPq2Nw/viewform).

Campos del form → socio:

| Form | Campo |
| --- | --- |
| Email | `email` |
| NOMBRE Y APELLIDO | `fullName` |
| EDAD | `age` |
| NUMERO DE TELEFONO | `phone` |

Defaults al crear desde el form:

- `condition` = Abonado Tenis
- `status` = Pendiente (`2`)

Integración: Apps Script → `POST /api/webhooks/google-form` (ver `docs/GOOGLE_FORM.md`).

## Alcance funcional (MVP)

1. Autenticación (login) de usuarios existentes.
2. Listado / consulta de socios con búsqueda, filtros (condición/estado) y paginación.
3. Alta (crear) de socios — solo ADMIN.
4. Edición de socios (todos los campos excepto el email) — solo ADMIN.
5. Soft delete de socios — solo ADMIN.
6. Alta automática desde Google Form en estado Pendiente (webhook).

## Fuera de alcance (por ahora)

- Registro self-service de usuarios del backoffice.
- Flujos de ranking / partidos / torneos (no forman parte de este producto).
- Gestión multi-club (el sistema asume un club).
