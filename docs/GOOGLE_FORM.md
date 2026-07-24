# Integración Google Form → Socios

Alta automática de aspirantes desde el form
[SOLICITUD ALTA DE ABONO - TENIS CALNA](https://docs.google.com/forms/d/e/1FAIpQLSfv6WHsFZCK5f-HV_ydRpRYugTURbPVzbJczD9OD5HLbPq2Nw/viewform).

## Resultado en el padrón

Cada envío crea un socio con:

- `condition` = `ABONADO_TENIS`
- `status` = `2` (Pendiente)
- Campos: email, nombre, edad, teléfono

El admin aprueba cambiando el estado a **Habilitado** en el backoffice.

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
  "fullName": "Juan Perez",
  "age": 28,
  "phone": "2922440000"
}
```

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
  -d "{\"email\":\"test@mail.com\",\"fullName\":\"Test User\",\"age\":30,\"phone\":\"123456\"}"
```

## Apps Script (pegar en el Form)

1. Abrí el form → menú **⋯** → **Script editor** (o desde la Sheet vinculada: Extensiones → Apps Script).
2. Pegá el contenido de `integrations/google-form/Code.gs`.
3. Completá `WEBHOOK_URL` (ngrok) y `WEBHOOK_SECRET`.
4. Guardá → **Activadores** → agregar trigger:
   - Función: `onFormSubmit`
   - Origen: desde el formulario
   - Tipo: Al enviar el formulario
5. Autorizá permisos la primera vez.

Si el script está en la **Spreadsheet** vinculada al form, el trigger también puede ser “Al enviar el formulario” sobre esa hoja.

## Mapeo de títulos de preguntas

El script busca estas etiquetas (como en el form):

- `Email`
- `NOMBRE Y APELLIDO`
- `EDAD`
- `NUMERO DE TELEFONO`
