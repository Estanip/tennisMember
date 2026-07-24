# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Monorepo inicial (`apps/api`, `apps/web`, `packages/shared`)
- API Fastify 5 con auth JWT, Swagger, rate limit y CRUD de socios (soft delete)
- Frontend Next.js 16 con login, listado (búsqueda/filtros/paginación), alta y edición
- Roles `ADMIN` (escritura) y `USER` (solo lectura)
- Seed local `admin@alem.com` / `Alem1916`
- Documentación de producto, conceptos, DB y deployment
- Separación de reglas del agente: `.cursorrules` genérico + docs específicos (`STACK`, `ARQUITECTURA`, `BACKEND`, `FRONTEND`, `MODELOS`)
- Estado de socio `Pendiente` (`2`) y webhook `POST /api/webhooks/google-form` (Apps Script + ngrok)
- Documentación e integración de Google Form (`docs/GOOGLE_FORM.md`, `integrations/google-form/Code.gs`)
- Collection Postman + environments Local/Test/Production (`docs/postman/`)
- Variables de entorno documentadas y plantillas por servicio (API, Web, Docker Compose)
- CI GitHub Actions (lint, typecheck, build) y configs Railway test (`railway.api.toml`, `railway.web.toml`)
- Guía de deploy test en Railway (`docs/DEPLOYMENT.md`)
- Modo claro / oscuro en el backoffice web (preferencia en `localStorage`)
