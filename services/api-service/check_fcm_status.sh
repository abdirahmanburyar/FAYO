#!/bin/bash
# Check FCM token registration status

echo "🔍 Checking FCM Token Registration Status..."
echo ""

# Check if fcm_tokens table exists
echo "1. Checking if fcm_tokens table exists..."
TABLE_EXISTS=$(sudo -u postgres psql -d fayo -t -c "
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'users' 
  AND table_name = 'fcm_tokens'
);
" | xargs)

if [ "$TABLE_EXISTS" = "t" ]; then
  echo "   ✅ fcm_tokens table exists"
else
  echo "   ❌ fcm_tokens table does NOT exist"
  echo "   Run: sudo -u postgres psql -d fayo -f create_fcm_token_migration.sql"
  exit 1
fi

echo ""
echo "2. Total FCM tokens registered:"
sudo -u postgres psql -d fayo -c "SELECT COUNT(*) as total_tokens FROM users.fcm_tokens;"

echo ""
echo "3. Active FCM tokens:"
sudo -u postgres psql -d fayo -c "SELECT COUNT(*) as active_tokens FROM users.fcm_tokens WHERE \"isActive\" = true;"

echo ""
echo "4. Tokens by platform:"
sudo -u postgres psql -d fayo -c "
SELECT 
  platform,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE \"isActive\" = true) as active
FROM users.fcm_tokens
GROUP BY platform
ORDER BY total DESC;
"

echo ""
echo "5. Patients with/without tokens:"
sudo -u postgres psql -d fayo -c "
SELECT 
  CASE 
    WHEN ft.id IS NOT NULL THEN 'Has Token'
    ELSE 'No Token'
  END as status,
  COUNT(DISTINCT u.id) as patient_count
FROM users.users u
LEFT JOIN users.fcm_tokens ft ON u.id = ft.\"userId\" AND ft.\"isActive\" = true
WHERE (u.role = 'PATIENT' OR u.\"userType\" = 'PATIENT') AND u.\"isActive\" = true
GROUP BY CASE WHEN ft.id IS NOT NULL THEN 'Has Token' ELSE 'No Token' END;
"

echo ""
echo "6. Recent token registrations (last 10):"
sudo -u postgres psql -d fayo -c "
SELECT 
  ft.\"createdAt\",
  u.email,
  u.\"firstName\",
  ft.platform,
  ft.\"isActive\"
FROM users.fcm_tokens ft
JOIN users.users u ON ft.\"userId\" = u.id
ORDER BY ft.\"createdAt\" DESC
LIMIT 10;
"

echo ""
echo "✅ Status check complete!"

