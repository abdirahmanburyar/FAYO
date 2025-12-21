#!/bin/sh

# Script to create admin user in the api-service container
# This script can be run inside the Docker container

echo "🚀 Creating admin user..."

# Run the Node.js script
node /app/scripts/create-admin.js

exit $?

