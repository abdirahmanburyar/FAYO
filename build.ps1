# PowerShell script to enable BuildKit and build Docker images

# Enable BuildKit for faster Docker builds
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

Write-Host "🚀 Building with BuildKit optimizations enabled..." -ForegroundColor Green
Write-Host ""

# Build all services or specific service
if ($args.Count -eq 0) {
    Write-Host "Building all services..." -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml build
} else {
    Write-Host "Building service: $($args[0])" -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml build $args
}

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Subsequent builds will be much faster thanks to BuildKit cache mounts." -ForegroundColor Yellow

