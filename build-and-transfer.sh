#!/bin/bash
# Build admin-panel locally and transfer to VPS
# Usage: ./build-and-transfer.sh [vps-host] [vps-path]

VPS_HOST="${1:-root@72.62.51.50}"
VPS_PATH="${2:-/root/fayo}"

set -e

echo "🔨 Building admin-panel..."
cd web/admin-panel
docker build -t admin-panel:latest .

echo "💾 Saving image..."
docker save admin-panel:latest | gzip > ../../admin-panel.tar.gz

echo "📤 Transferring to VPS..."
scp ../../admin-panel.tar.gz ${VPS_HOST}:${VPS_PATH}/

echo ""
echo "✅ Build and transfer complete!"
echo ""
echo "📋 On your VPS, run these commands:"
echo "  cd ${VPS_PATH}"
echo "  gunzip -c admin-panel.tar.gz | docker load"
echo "  docker tag admin-panel:latest fayo-admin-panel:latest"
echo "  docker compose -f docker-compose.prod.yml up -d admin-panel"
echo ""

