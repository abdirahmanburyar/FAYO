-- Create Admin User SQL Script
-- This script creates an admin user in the users schema
-- Default credentials: username='0001', password='admin123', email='admin@fayo.com'

-- Check if admin already exists
DO $$
DECLARE
    existing_admin_id TEXT;
    existing_user_id TEXT;
    hashed_password TEXT;
BEGIN
    -- Check if an admin user already exists
    SELECT id INTO existing_admin_id
    FROM users.users
    WHERE role = 'ADMIN'
    LIMIT 1;

    IF existing_admin_id IS NOT NULL THEN
        RAISE NOTICE '✅ Admin user already exists with ID: %', existing_admin_id;
        RETURN;
    END IF;

    -- Check if username or email is already taken
    SELECT id INTO existing_user_id
    FROM users.users
    WHERE username = '0001' OR email = 'admin@fayo.com'
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION '❌ Username "0001" or email "admin@fayo.com" is already taken';
    END IF;

    -- Pre-hashed bcrypt password for 'admin123' (10 rounds)
    -- This hash was generated using: bcrypt.hash('admin123', 10)
    hashed_password := '$2a$10$oPrCveNxMrjgl7TRR52vNe7A1obKYXpZfdFqqWgYKW3MydyuP/lxm';

    -- Create the admin user
    -- Generate a CUID-like ID (Prisma format: 'c' + 25 alphanumeric chars)
    -- Simple approach: 'c' + timestamp (hex) + random hash
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
        -- Generate CUID-like ID: 'c' + 25 chars (8 hex timestamp + 17 random)
        'c' || 
        lpad(to_hex((extract(epoch from now()) * 1000)::bigint), 8, '0') || 
        substr(replace(md5(random()::text || clock_timestamp()::text), '-', ''), 1, 17),
        '0001',
        'admin@fayo.com',
        hashed_password,
        'System',
        'Administrator',
        'ADMIN',
        'HOSPITAL_MANAGER',
        true,
        NOW(),
        NOW()
    );

    RAISE NOTICE '✅ Admin user created successfully!';
    RAISE NOTICE '📋 Admin Credentials:';
    RAISE NOTICE '   Username: 0001';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '   Email: admin@fayo.com';
    RAISE NOTICE '   Role: ADMIN';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Please change the default password after first login!';

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION '❌ A user with this username or email already exists';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error creating admin user: %', SQLERRM;
END $$;

-- Verify the admin was created
SELECT 
    id,
    username,
    email,
    role,
    "userType",
    "isActive",
    "createdAt"
FROM users.users
WHERE role = 'ADMIN'
ORDER BY "createdAt" DESC
LIMIT 1;

