# PowerShell script to build admin-panel locally and transfer to VPS
# Usage: .\build-and-transfer.ps1 [vps-host] [vps-path]

param(
    [string]$VpsHost = "root@72.62.51.50",
    [string]$VpsPath = "/root/fayo"
)

Write-Host "🔨 Building admin-panel..." -ForegroundColor Cyan
Set-Location web\admin-panel
docker build -t admin-panel:latest .

Write-Host "💾 Saving image..." -ForegroundColor Cyan
docker save admin-panel:latest | gzip > ..\..\admin-panel.tar.gz

Write-Host "📤 Transferring to VPS..." -ForegroundColor Cyan
scp ..\..\admin-panel.tar.gz "${VpsHost}:${VpsPath}/"

Write-Host ""
Write-Host "✅ Build and transfer complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 On your VPS, run these commands:" -ForegroundColor Yellow
Write-Host "  cd ${VpsPath}"
Write-Host "  gunzip -c admin-panel.tar.gz | docker load"
Write-Host "  docker tag admin-panel:latest fayo-admin-panel:latest"
Write-Host "  docker compose -f docker-compose.prod.yml up -d admin-panel"
Write-Host ""

