# Create Admin User Using SQL

## Quick Method

Run the SQL script directly in PostgreSQL:

```bash
# Using docker compose
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d fayo -f /tmp/create-admin.sql

# Or copy the file first, then run it
docker cp services/api-service/scripts/create-admin.sql postgres:/tmp/create-admin.sql
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d fayo -f /tmp/create-admin.sql
```

## Direct SQL Execution

You can also paste the SQL directly:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d fayo << 'EOF'
-- Paste the contents of create-admin.sql here
EOF
```

## Or Copy-Paste into psql

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d fayo

# Then paste and run the SQL from create-admin.sql
```

## Default Credentials Created

- **Username:** `0001`
- **Password:** `admin123`
- **Email:** `admin@fayo.com`
- **Role:** `ADMIN`

## Verify Admin Was Created

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d fayo -c "SELECT username, email, role FROM users.users WHERE role='ADMIN';"
```

## Custom Credentials

To create an admin with custom credentials, edit the SQL file and change:
- `'0001'` to your desired username
- `'admin@fayo.com'` to your desired email
- `'System'` and `'Administrator'` to your desired first/last name
- The `hashed_password` value (you'll need to generate a new bcrypt hash)

To generate a new bcrypt hash:

```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('yourpassword',10).then(h=>console.log(h));"
```

Then replace the `hashed_password` value in the SQL file.

