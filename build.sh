#!/bin/bash

# Enable BuildKit for faster Docker builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with optimizations
echo "🚀 Building with BuildKit optimizations enabled..."
echo ""

# Build all services or specific service
if [ -z "$1" ]; then
    echo "Building all services..."
    docker-compose -f docker-compose.prod.yml build "$@"
else
    echo "Building service: $1"
    docker-compose -f docker-compose.prod.yml build "$@"
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "💡 Tip: Subsequent builds will be much faster thanks to BuildKit cache mounts."

