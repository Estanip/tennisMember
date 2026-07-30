# PRODUCT CONTEXT — Socios Backoffice

## Visión

Aplicación web/mobile para la gestión de socios de un club de tenis. El sistema permite mantener un padrón centralizado de socios, con autenticación restringida y administración por roles.

## Objetivo

Proveer un backoffice simple y confiable para:

- Iniciar sesión (solo usuarios existentes; sin registro público).
- Consultar socios (todos los roles autenticados).
- Crear y editar socios (solo administradores).
- Recibir solicitudes de alta de abono desde Google Form (aspirantes públicos) en estado Habilitado.

## Autenticación y roles

- **Login únicamente**: no existe flujo de registro de nuevos usuarios desde la aplicación.
- Inicio de sesión con **email** o **username** (opcional en DB; único si existe).
- Los usuarios de acceso se dan de alta por fuera del flujo público (p. ej. seed, operación interna o bootstrap).
- Roles:
  - **SUPER_ADMIN**: gestión de usuarios del backoffice (roles y contraseñas) y todo lo de ADMIN.
  - **ADMIN**: puede crear y editar socios.
  - **USER**: puede consultar el padrón (solo lectura); no puede crear ni editar.

## Modelo de dominio: Socio

Cada socio pertenece al club y tiene las siguientes propiedades:

| Propiedad          | Descripción                       | Reglas                                                         |
| ------------------ | --------------------------------- | -------------------------------------------------------------- |
| Nombre             | Nombre de pila                    | Obligatorio; 2–60 caracteres; editable                                          |
| Apellido           | Apellido                          | Obligatorio; 2–60 caracteres; editable                                          |
| Email              | Contacto del socio (opcional)     | Opcional; formato válido si se carga; único si existe; si ya hay valor, solo SUPER_ADMIN puede editarlo/vaciarlo |
| DNI                | Documento nacional de identidad   | Obligatorio; 7–8 dígitos; único; editable                                          |
| Fecha de nacimiento | Fecha de nacimiento del socio    | Obligatoria; se guarda en DB; la edad se calcula al consultar                      |
| Edad               | Edad del socio (derivada)         | No se persiste; se infiere desde fecha de nacimiento (0–100)                       |
| Categoría          | Adulto / Menor (solo UI)          | Menor si edad &lt; 14; no se guarda en DB                                           |
| Número de teléfono | Contacto telefónico               | Opcional en alta manual; si se carga: exactamente 10 dígitos, sin 0 ni 15. Obligatorio en Google Form (misma regla) |
| Condición          | Tipo de membresía                 | `Socio Regular` \| `Abonado Tenis`                             |
| Estado             | Habilitación del socio en el club | DB: `0` No Habilitado · `1` Habilitado · `2` Pendiente · `3` Eliminado |

### Condición

- **Socio Regular**: socio del club sin abono específico de tenis.
- **Abonado Tenis**: socio con abono de tenis.

### Estado

- **No Habilitado (`0`)**: el socio no está habilitado.
- **Habilitado (`1`)**: el socio está activo / habilitado en el club.
- **Pendiente (`2`)**: estado intermedio de revisión manual (sigue disponible en el padrón).
- **Eliminado (`3`)**: baja lógica; se setea `deletedAt` y un motivo (`Falta de pago`, `Baja de socio` u `Otra` + detalle). Se puede **restablecer** → status `1`, `deletedAt = null` y se limpian motivo/detalle.

### Baja

- Soft delete: `status = 3` + `deletedAt` + motivo obligatorio; el socio puede filtrarse como Eliminado y restablecerse.

## Google Form (solicitudes públicas)

Form de referencia: [SOLICITUD ALTA DE ABONO - TENIS CALNA](https://docs.google.com/forms/d/e/1FAIpQLSfv6WHsFZCK5f-HV_ydRpRYugTURbPVzbJczD9OD5HLbPq2Nw/viewform).

Campos del form → socio:

| Form | Campo |
| --- | --- |
| Email | `email` |
| NOMBRE | `firstName` |
| APELLIDO | `lastName` |
| DNI | `dni` |
| FECHA DE NACIMIENTO | `birthDate` (`dd/mm/aaaa`) |
| NUMERO DE TELEFONO | `phone` |

Defaults al crear desde el form:

- `condition` = Abonado Tenis
- `status` = Habilitado (`1`)

Integración: Apps Script → `POST /api/webhooks/google-form` (ver `docs/GOOGLE_FORM.md`).

## Alcance funcional (MVP)

1. Autenticación (login) de usuarios existentes.
2. Listado / consulta de socios con búsqueda, filtros (condición/estado) y paginación.
3. Alta (crear) de socios — solo ADMIN.
4. Edición de socios — solo ADMIN (email ya seteado: solo SUPER_ADMIN puede cambiarlo/vaciarlo).
5. Soft delete de socios — solo ADMIN.
6. Alta automática desde Google Form en estado Habilitado (webhook).
7. Alerta por email al administrador cuando se crea un socio (app o Google Form; no en import Excel).
8. Exportar / importar socios en Excel (plantilla fija).

## Fuera de alcance (por ahora)

- Registro self-service de usuarios del backoffice.
- Flujos de ranking / partidos / torneos (no forman parte de este producto).
- Gestión multi-club (el sistema asume un club).
