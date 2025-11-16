-- ============================================
-- FAYO Healthcare - Admin User Creation SQL
-- ============================================
-- This script creates an admin user in the PostgreSQL database
-- 
-- TO RUN IN PRODUCTION:
-- 1. Copy this file to your VPS
-- 2. Run inside the PostgreSQL container:
--    docker exec -i fayo-postgres psql -U postgres -d fayo < create-admin.sql
-- 
-- Or connect to psql and paste the SQL:
--    docker exec -it fayo-postgres psql -U postgres -d fayo
--    (then paste the SQL below)
--
-- ============================================

-- Ensure the users schema exists
CREATE SCHEMA IF NOT EXISTS users;

-- Insert admin user with bcrypt hash for password 'admin123'
INSERT INTO users.users (
  id,
  username,
  email,
  password,
  "firstName",
  "lastName",
  role,
  "userType",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 18), -- Generate a CUID-like ID
  '0001',
  'admin@fayo.com',
  '$2a$10$.4mqyvLbgC5UJTj.zJEZl.QaHUDVetZVL.qbylrQUo76Qdz5Qp9qS', -- bcrypt hash for 'admin123' (salt rounds: 10)
  'System',
  'Administrator',
  'ADMIN',
  'HOSPITAL_MANAGER',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  role = EXCLUDED.role,
  "userType" = EXCLUDED."userType",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Verify the admin user was created
SELECT 
  id,
  username,
  email,
  "firstName",
  "lastName",
  role,
  "userType",
  "isActive",
  "createdAt"
FROM users.users
WHERE username = '0001' AND role = 'ADMIN';

-- ============================================
-- Admin Credentials:
-- Username: 0001
-- Password: admin123
-- Email: admin@fayo.com
-- ============================================

