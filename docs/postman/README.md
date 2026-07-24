# Postman — TennisMember API

Collection y environments para probar la API (`apps/api`).

## Importar

1. Abrí Postman → **Import**.
2. Importá estos archivos (podés seleccionarlos todos a la vez):
   - `TennisMember-API.postman_collection.json`
   - `Local.postman_environment.json`
   - `Test.postman_environment.json`
   - `Production.postman_environment.json`
3. En el selector de environment (arriba a la derecha) elegí **Local**, **Test** o **Production**.

## Environments

| Environment | `baseUrl` | Notas |
| --- | --- | --- |
| **Local** | `http://localhost:3003` | Credenciales seed y webhook secret de desarrollo |
| **Test** | `https://api-test.tennismember.example` | Placeholder — reemplazar cuando exista el ambiente |
| **Production** | `https://api.tennismember.example` | Placeholder — reemplazar cuando exista el ambiente |

### Variables

| Variable | Uso |
| --- | --- |
| `baseUrl` | Host de la API (sin `/api` al final) |
| `token` | JWT; se completa solo al ejecutar **Auth → Login** |
| `webhookSecret` | Header `X-Webhook-Secret` del webhook Google Form |
| `memberId` | Id de socio para GET/PATCH/DELETE; se completa al crear un member |
| `adminEmail` / `adminPassword` | Body del Login |

## Flujo rápido (Local)

1. API corriendo: `yarn dev:api` (y DB + seed si hace falta).
2. Environment: **Local**.
3. **Auth → Login** (`admin@alem.com` / `Alem1916`) → guarda `token`.
4. **Auth → Me** o **Members → List members**.
5. **Members → Create member** → guarda `memberId` para get/update/delete.
6. **Webhooks → Google Form** usa `webhookSecret` (sin JWT).

## Endpoints incluidos

| Método | Path | Auth |
| --- | --- | --- |
| `GET` | `/health` | — |
| `POST` | `/api/auth/login` | — |
| `GET` | `/api/auth/me` | Bearer |
| `GET` | `/api/members` | Bearer |
| `GET` | `/api/members/:id` | Bearer |
| `POST` | `/api/members` | Bearer + ADMIN |
| `PATCH` | `/api/members/:id` | Bearer + ADMIN |
| `DELETE` | `/api/members/:id` | Bearer + ADMIN |
| `POST` | `/api/webhooks/google-form` | `X-Webhook-Secret` |

Alternativa interactiva en local: Swagger en `http://localhost:3003/docs`.
