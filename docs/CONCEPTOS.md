# Conceptos de negocio

| Concepto | Descripción |
| --- | --- |
| Socio | Persona registrada en el padrón del club |
| Condición | Tipo de membresía: Socio Regular o Abonado Tenis |
| Estado | `0` No Habilitado · `1` Habilitado · `2` Pendiente |
| Pendiente | Solicitud (p. ej. Google Form) a la espera de revisión del admin |
| Soft delete | Baja lógica del socio (`deletedAt`); no se borra el registro |
| ADMIN | Usuario con permiso de crear, editar y eliminar socios |
| USER | Usuario con permiso de solo consulta del padrón |
| Webhook Google Form | Alta automática de Abonado Tenis en estado Pendiente |
