-- Create admin user with pre-hashed password
-- Password: admin123
-- Hash: $2a$10$ZgIqzFeV9tKNOQ2lm5RGju6mK/tRVUO6XauNHDlDn72r17hNmn95S

INSERT INTO users.users (
    id,
    username,
    email,
    password,
    "firstName",
    "lastName",
    role,
    "userType",
    "isActive"
) VALUES (
    'admin-' || gen_random_uuid()::text,
    '0001',
    'admin@fayo.com',
    '$2a$10$ZgIqzFeV9tKNOQ2lm5RGju6mK/tRVUO6XauNHDlDn72r17hNmn95S',
    'System',
    'Administrator',
    'ADMIN',
    'HOSPITAL_MANAGER',
    true
)
ON CONFLICT (username) DO NOTHING;

