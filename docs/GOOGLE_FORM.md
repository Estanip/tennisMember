# Integración Google Form → Socios

Alta automática de aspirantes desde el form
[SOLICITUD ALTA DE ABONO - TENIS CALNA](https://docs.google.com/forms/d/e/1FAIpQLSfv6WHsFZCK5f-HV_ydRpRYugTURbPVzbJczD9OD5HLbPq2Nw/viewform).

## Resultado en el padrón

Cada envío crea un socio con:

- `condition` = la enviada en el payload (`ABONADO_TENIS` o `SOCIO_REGULAR`). Si se omite → `ABONADO_TENIS` (compatibilidad con scripts viejos)
- `status` = `1` (Habilitado)
- Campos: email, nombre, apellido, DNI, fecha de nacimiento, teléfono
- La edad y la categoría (Adulto/Menor) se calculan al consultar (Menor = edad &lt; 14)

Podés reutilizar **el mismo webhook URL y el mismo `WEBHOOK_SECRET`** en dos formularios: solo cambiá `MEMBER_CONDITION` en el Apps Script de cada uno.

## Endpoint

```http
POST /api/webhooks/google-form
Content-Type: application/json
X-Webhook-Secret: <GOOGLE_FORM_WEBHOOK_SECRET>
```

Body:

```json
{
  "email": "aspirante@mail.com",
  "firstName": "Juan",
  "lastName": "Perez",
  "dni": "30123456",
  "birthDate": "15/03/1995",
  "phone": "2922440000",
  "condition": "ABONADO_TENIS"
}
```

`condition` es opcional: `ABONADO_TENIS` | `SOCIO_REGULAR` (default `ABONADO_TENIS`).

`birthDate` acepta `dd/mm/aaaa` o `YYYY-MM-DD`.

Variable de entorno en `apps/api/.env`:

```env
GOOGLE_FORM_WEBHOOK_SECRET="local-google-form-webhook-secret"
```

## Prueba local con tunnel (ngrok)

1. API corriendo: `yarn dev:api`
2. Exponer el puerto:

```bash
ngrok http 3003
```

3. Usar la URL HTTPS de ngrok, por ejemplo:

`https://xxxx.ngrok-free.app/api/webhooks/google-form`

4. Probar con curl:

```bash
curl -X POST "https://xxxx.ngrok-free.app/api/webhooks/google-form" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: local-google-form-webhook-secret" \
  -d "{\"email\":\"test@mail.com\",\"firstName\":\"Test\",\"lastName\":\"User\",\"dni\":\"30123456\",\"birthDate\":\"15/03/1995\",\"phone\":\"2914123456\"}"
```

## Apps Script (pegar en el Form)

1. Abrí el form → menú **⋯** → **Script editor** (o desde la Sheet vinculada: Extensiones → Apps Script).
2. Pegá el contenido de `integrations/google-form/Code.gs`.
3. Completá `WEBHOOK_URL` (ngrok o API) y `WEBHOOK_SECRET`.
4. Seteá `MEMBER_CONDITION` (`ABONADO_TENIS` o `SOCIO_REGULAR`) según el formulario.
5. Guardá → **Activadores** → agregar trigger:
   - Función: `onFormSubmit`
   - Origen: desde el formulario
   - Tipo: Al enviar el formulario
6. Autorizá permisos la primera vez.

Si el script está en la **Spreadsheet** vinculada al form, el trigger también puede ser “Al enviar el formulario” sobre esa hoja.

## Mapeo de títulos de preguntas

El script busca estas etiquetas (como en el form):

- `Email`
- `NOMBRE`
- `APELLIDO`
- `DNI`
- `FECHA DE NACIMIENTO` (formato `dd/mm/aaaa`)
- `Teléfono` (también acepta `TELEFONO`, `NUMERO DE TELEFONO`, `NRO DE TELEFONO`)

Usá preguntas separadas **`Nombre`** y **`Apellido`** (obligatorias). Actualizá el Apps Script con `integrations/google-form/Code.gs`.
