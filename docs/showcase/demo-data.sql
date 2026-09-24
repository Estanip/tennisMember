-- Showcase / portfolio ONLY — TennisMember (Administrador de Socios)
-- Requiere: Neon DEMO + migrate (tablas users / members ya creadas).
-- Idempotente: se puede re-correr.
--
-- Orden:
-- 1. Neon proyecto nuevo → DATABASE_URL en Render (direct, sin -pooler)
-- 2. Deploy API (migrate)
-- 3. Neon SQL Editor → Run este archivo
-- 4. Login web:
--      superadmin@socios.demo / DemoAdmin123!
--      admin@socios.demo / DemoAdmin123!
--      viewer@socios.demo / DemoUser123!
--
-- NO ejecutar contra la DB del club.

-- ---------------------------------------------------------------------------
-- Users (backoffice)
-- bcrypt: DemoAdmin123! / DemoUser123!
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, email, username, name, "passwordHash", role, "createdAt", "updatedAt"
) VALUES
(
  'demo_user_superadmin',
  'superadmin@socios.demo',
  'superadmin',
  'Super Admin Demo',
  '$2b$10$.XzVgDP1TeOPmthGIPU6B.64sZ959MgD/F51MElNbgyG/0BM4wqYW',
  'SUPER_ADMIN',
  NOW(),
  NOW()
),
(
  'demo_user_admin',
  'admin@socios.demo',
  'admin',
  'Admin Demo',
  '$2b$10$.XzVgDP1TeOPmthGIPU6B.64sZ959MgD/F51MElNbgyG/0BM4wqYW',
  'ADMIN',
  NOW(),
  NOW()
),
(
  'demo_user_viewer',
  'viewer@socios.demo',
  'viewer',
  'Viewer Demo',
  '$2b$10$2f5BCQytyRf7CD17me68Hu/oe53pdS3TeurxRKPCU.bD3wB6CJqta',
  'USER',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  "passwordHash" = EXCLUDED."passwordHash",
  role = EXCLUDED.role,
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Members (padrón de muestra)
-- status: 0=No habilitado, 1=Habilitado, 2=Pendiente, 3=Eliminado
-- ---------------------------------------------------------------------------
INSERT INTO members (
  id,
  member_id,
  "firstName",
  "lastName",
  email,
  dni,
  "birthDate",
  phone,
  condition,
  status,
  "deletedAt",
  "deletedReason",
  "deletedReasonDetail",
  "createdAt",
  "updatedAt"
) VALUES
(
  'demo_member_001',
  '1001',
  'María',
  'González',
  'maria.gonzalez@example.com',
  '30111222',
  DATE '1990-03-15',
  '2914555001',
  'ABONADO_TENIS',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_002',
  '1002',
  'Juan',
  'Pérez',
  'juan.perez@example.com',
  '28555666',
  DATE '1985-07-22',
  '2914555002',
  'ABONADO_TENIS',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_003',
  '1003',
  'Lucía',
  'Fernández',
  'lucia.fernandez@example.com',
  '32444555',
  DATE '1995-11-08',
  '2914555003',
  'SOCIO_REGULAR',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_004',
  '1004',
  'Carlos',
  'Ruiz',
  'carlos.ruiz@example.com',
  '27123456',
  DATE '1978-01-30',
  '2914555004',
  'ABONADO_TENIS',
  2,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_005',
  '1005',
  'Ana',
  'Martínez',
  'ana.martinez@example.com',
  '33999888',
  DATE '2001-05-12',
  '2914555005',
  'SOCIO_REGULAR',
  0,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_006',
  '1006',
  'Diego',
  'López',
  'diego.lopez@example.com',
  '25666777',
  DATE '1982-09-03',
  '2914555006',
  'ABONADO_TENIS',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_007',
  '1007',
  'Valentina',
  'Sosa',
  'valentina.sosa@example.com',
  '35111223',
  DATE '1998-12-19',
  '2914555007',
  'ABONADO_TENIS',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_008',
  '1008',
  'Martín',
  'Castro',
  NULL,
  '24888999',
  DATE '1975-04-25',
  '2914555008',
  'SOCIO_REGULAR',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_009',
  '1009',
  'Sofía',
  'Vargas',
  'sofia.vargas@example.com',
  '36777888',
  DATE '2000-08-14',
  '2914555009',
  'ABONADO_TENIS',
  1,
  NULL, NULL, NULL,
  NOW(), NOW()
),
(
  'demo_member_010',
  '1010',
  'Pedro',
  'Morales',
  'pedro.morales@example.com',
  '22333444',
  DATE '1970-02-01',
  '2914555010',
  'ABONADO_TENIS',
  3,
  NOW() - INTERVAL '30 days',
  'BAJA_DE_SOCIO',
  NULL,
  NOW() - INTERVAL '400 days',
  NOW() - INTERVAL '30 days'
)
ON CONFLICT (dni) DO UPDATE SET
  member_id = EXCLUDED.member_id,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  condition = EXCLUDED.condition,
  status = EXCLUDED.status,
  "deletedAt" = EXCLUDED."deletedAt",
  "deletedReason" = EXCLUDED."deletedReason",
  "deletedReasonDetail" = EXCLUDED."deletedReasonDetail",
  "updatedAt" = NOW();
