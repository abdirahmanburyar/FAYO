#!/bin/bash

# FAYO AI - Service Build Script
# This script builds all services with their Dockerfiles

echo "🚀 Building FAYO AI Services..."

# Function to build a service
build_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "📦 Building $service_name..."
    
    if [ -f "$service_path/Dockerfile" ]; then
        docker build -t "fayo-$service_name" "$service_path"
        echo "✅ $service_name built successfully"
        echo "   Run with: docker run -p $port:$port fayo-$service_name"
    else
        echo "❌ Dockerfile not found for $service_name"
    fi
    echo ""
}

# Build all services
build_service "user-service" "./services/user-service" "3001"
build_service "hospital-service" "./services/hospital-service" "3002"
build_service "doctor-service" "./services/doctor-service" "3003"
build_service "admin-panel" "./web/admin-panel" "3000"

echo "🎉 All services built successfully!"
echo ""
echo "To start infrastructure services:"
echo "docker-compose up -d"
echo ""
echo "To run individual services:"
echo "docker run -p 3001:3001 fayo-user-service"
echo "docker run -p 3002:3002 fayo-hospital-service"
echo "docker run -p 3003:3003 fayo-doctor-service"
echo "docker run -p 3000:3000 fayo-admin-panel"
