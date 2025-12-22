-- Check for duplicate values that would violate unique constraints
-- Run these queries BEFORE creating the migration

-- 1. Check for duplicate appointmentNumbers
SELECT "appointmentNumber", COUNT(*) as count
FROM appointments.appointments
GROUP BY "appointmentNumber"
HAVING COUNT(*) > 1;

-- 2. Check for duplicate userIds in hospitals
SELECT "userId", COUNT(*) as count
FROM hospitals.hospitals
WHERE "userId" IS NOT NULL
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- 3. Check for duplicate transactionIds in payments
SELECT "transactionId", COUNT(*) as count
FROM payments.payments
WHERE "transactionId" IS NOT NULL
GROUP BY "transactionId"
HAVING COUNT(*) > 1;

-- 4. Check for duplicate receiptNumbers in payments
SELECT "receiptNumber", COUNT(*) as count
FROM payments.payments
WHERE "receiptNumber" IS NOT NULL
GROUP BY "receiptNumber"
HAVING COUNT(*) > 1;

-- 5. Check for duplicate usernames
SELECT username, COUNT(*) as count
FROM users.users
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;

-- 6. Check for duplicate emails
SELECT email, COUNT(*) as count
FROM users.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 7. Check for duplicate phones
SELECT phone, COUNT(*) as count
FROM users.users
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1;

