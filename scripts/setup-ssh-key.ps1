# PowerShell script to set up SSH key for GitHub Actions deployment
# Run this script on Windows to generate and copy SSH key to VPS

$VPS_HOST = "31.97.58.62"
$VPS_USER = "root"
$VPS_PASSWORD = "Buryar@2020#"
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa_github_actions"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SSH Key Setup for GitHub Actions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH key already exists
if (Test-Path $SSH_KEY_PATH) {
    $response = Read-Host "SSH key already exists. Do you want to generate a new key? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Using existing key..."
        exit 0
    }
}

# Generate SSH key using ssh-keygen
Write-Host "Generating SSH key..." -ForegroundColor Green
$sshKeygenPath = "ssh-keygen"
if (Get-Command $sshKeygenPath -ErrorAction SilentlyContinue) {
    & $sshKeygenPath -t rsa -b 4096 -f $SSH_KEY_PATH -N '""' -C "github-actions-deploy"
} else {
    Write-Host "Error: ssh-keygen not found. Please install OpenSSH or Git for Windows." -ForegroundColor Red
    exit 1
}

# Copy public key to VPS
Write-Host ""
Write-Host "Copying public key to VPS..." -ForegroundColor Green

# Read the public key
$publicKey = Get-Content "$SSH_KEY_PATH.pub"

# Use Plink or SSH to copy the key
$plinkPath = "plink"
if (Get-Command $plinkPath -ErrorAction SilentlyContinue) {
    # Using Plink (PuTTY)
    echo y | & $plinkPath -ssh $VPS_USER@$VPS_HOST -pw $VPS_PASSWORD "mkdir -p ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
} else {
    # Try using SSH with expect-like functionality
    Write-Host "Plink not found. Please manually add the public key:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command:" -ForegroundColor Yellow
    Write-Host "type $SSH_KEY_PATH.pub | ssh $VPS_USER@$VPS_HOST 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or manually copy the key below to ~/.ssh/authorized_keys on the VPS:" -ForegroundColor Yellow
    Write-Host $publicKey -ForegroundColor Cyan
    exit 1
}

# Test SSH connection
Write-Host ""
Write-Host "Testing SSH connection..." -ForegroundColor Green
ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo 'SSH connection successful!'"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add the following as a GitHub Secret named 'VPS_SSH_PRIVATE_KEY':" -ForegroundColor Yellow
Write-Host ""
Get-Content $SSH_KEY_PATH
Write-Host ""
Write-Host "2. Go to your GitHub repository" -ForegroundColor Yellow
Write-Host "3. Navigate to Settings > Secrets and variables > Actions" -ForegroundColor Yellow
Write-Host "4. Click 'New repository secret'" -ForegroundColor Yellow
Write-Host "5. Name: VPS_SSH_PRIVATE_KEY" -ForegroundColor Yellow
Write-Host "6. Value: (paste the entire private key content above)" -ForegroundColor Yellow
Write-Host ""

