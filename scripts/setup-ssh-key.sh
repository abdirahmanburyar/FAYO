#!/bin/bash

# Script to set up SSH key for GitHub Actions deployment
# Run this script on your local machine to generate and copy SSH key to VPS

set -e

VPS_HOST="31.97.58.62"
VPS_USER="root"
VPS_PASSWORD="Buryar@2020#"

echo "=========================================="
echo "SSH Key Setup for GitHub Actions"
echo "=========================================="
echo ""

# Check if SSH key already exists
if [ -f ~/.ssh/id_rsa_github_actions ]; then
    echo "SSH key already exists at ~/.ssh/id_rsa_github_actions"
    read -p "Do you want to generate a new key? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key..."
        exit 0
    fi
fi

# Generate SSH key
echo "Generating SSH key..."
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_github_actions -N "" -C "github-actions-deploy"

# Copy public key to VPS using sshpass
echo ""
echo "Copying public key to VPS..."
if command -v sshpass &> /dev/null; then
    sshpass -p "$VPS_PASSWORD" ssh-copy-id -i ~/.ssh/id_rsa_github_actions.pub -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST
else
    echo "sshpass not found. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo ""
    echo "Or manually copy the key:"
    echo "  cat ~/.ssh/id_rsa_github_actions.pub | ssh $VPS_USER@$VPS_HOST 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'"
    exit 1
fi

# Test SSH connection
echo ""
echo "Testing SSH connection..."
ssh -i ~/.ssh/id_rsa_github_actions -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo 'SSH connection successful!'"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Add the following as a GitHub Secret named 'VPS_SSH_PRIVATE_KEY':"
echo ""
cat ~/.ssh/id_rsa_github_actions
echo ""
echo "2. Go to your GitHub repository"
echo "3. Navigate to Settings > Secrets and variables > Actions"
echo "4. Click 'New repository secret'"
echo "5. Name: VPS_SSH_PRIVATE_KEY"
echo "6. Value: (paste the entire private key content above)"
echo ""
echo "The public key has been added to the VPS authorized_keys file."

