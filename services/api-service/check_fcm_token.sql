-- Quick query to check if a specific FCM token exists
-- Run this after the migration is complete

-- Find the specific token
SELECT 
  ft.id,
  ft.token,
  ft."userId",
  ft.platform,
  ft."deviceId",
  ft."isActive",
  ft."createdAt",
  ft."updatedAt",
  u.email,
  u."firstName",
  u."lastName"
FROM users.fcm_tokens ft
LEFT JOIN users.users u ON ft."userId" = u.id
WHERE ft.token = 'BPrPJU7e58S7fX9g9PupTwuYhfXnLSvxXiugUBqjtUVR_iXDc99FHbsFFoluuScHdemt0ZBGwVzprPX1-ICtP_4';

-- If the token doesn't exist, it means:
-- 1. The Flutter app hasn't registered it yet, OR
-- 2. The token registration failed

-- To see all tokens:
SELECT * FROM users.fcm_tokens ORDER BY "createdAt" DESC LIMIT 10;

