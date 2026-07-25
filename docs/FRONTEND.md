# Frontend

Aplicación: `apps/web` (Next.js 16 App Router, React 19, TypeScript estricto).

## Estado y auth

- React Context API (`AuthProvider` / `useAuth`) para sesión.
- Token JWT en `localStorage` vía el API client.
- `ADMIN`: puede crear, editar y eliminar socios en UI.
- `USER`: solo listado/consulta; sin acciones de escritura ni rutas de alta/edición.

## API client

- Singleton `apiClient` con `fetch` nativo.
- Base URL: `NEXT_PUBLIC_API_URL` (local: `http://localhost:3003/api`).
- Puerto del servidor Next: `PORT` en `.env.local` (default local: `3004`).
- Tipado de requests/responses con `@socios/shared`.

Plantilla: `apps/web/.env.example`.

## UI

- Estilo alineado visualmente con CourtBook admin (tokens stone + accent `#2B7FFF`, tipografía DM Sans / Source Serif 4).
- CSS propio (sin Tailwind); clases semánticas en `globals.css`.
- Temas **claro** / **oscuro** / **sistema** (`localStorage`); toggle en login y topbar.
- Pantallas MVP:
  - Login
  - Listado de socios (búsqueda, filtros condición/estado incl. Pendiente, paginación)
  - Alta y edición de socios (email read-only en edición; admin puede pasar Pendiente → Habilitado)

## Convenciones

- App Router bajo `apps/web/src/app`.
- Componentes reutilizables en `apps/web/src/components`.
- No acceder a Prisma ni a secretos de servidor desde el cliente.
