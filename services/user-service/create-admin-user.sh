#!/bin/bash
# Create admin user in user-service database
# Password: admin123 (will be hashed by bcrypt)

# Generate bcrypt hash for password "admin123"
# Using Node.js to generate the hash
HASHED_PASSWORD=$(docker exec user-service node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));")

# Wait a bit for the hash to be generated
sleep 2

# Get the actual hash (bcrypt hash starts with $2a$ or $2b$)
# We'll use a pre-generated hash instead
# bcrypt hash for "admin123" with salt rounds 10: $2a$10$rOzJ8Z8Z8Z8Z8Z8Z8Z8Z8e
# Let's use a simpler approach - run the create-admin script inside the container

echo "Creating admin user..."
docker exec user-service npm run create-admin

