#!/bin/bash

# Script to run the ad payments migration and regenerate Prisma client

echo "🔄 Running ad payments migration on payment_service database..."
cat add-ad-payments-migration.sql | docker exec -i postgres psql -U postgres -d payment_service

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""
echo "🔄 Regenerating Prisma client in payment-service container..."
docker exec -i payment-service npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client regenerated successfully"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

echo ""
echo "🔄 Restarting payment-service container..."
docker compose -f ../../docker-compose.prod.yml restart payment-service

if [ $? -eq 0 ]; then
    echo "✅ Payment service restarted successfully"
    echo ""
    echo "🎉 All done! The payment service should now support ad payments."
else
    echo "❌ Failed to restart payment service"
    exit 1
fi

