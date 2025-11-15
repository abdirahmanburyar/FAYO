# SSH Key Setup for GitHub Actions

This guide will help you set up the SSH key needed for automatic deployment to your VPS.

## 🚀 Quick Setup

### Option 1: Automated Script (Recommended)

**On Linux/macOS:**
```bash
chmod +x scripts/setup-ssh-key.sh
./scripts/setup-ssh-key.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\setup-ssh-key.ps1
```

The script will:
1. Generate an SSH key pair
2. Copy the public key to your VPS
3. Display the private key that you need to add to GitHub

### Option 2: Manual Setup

#### Step 1: Generate SSH Key

**Linux/macOS:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_github_actions -N "" -C "github-actions-deploy"
```

**Windows (Git Bash):**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_github_actions -N "" -C "github-actions-deploy"
```

#### Step 2: Copy Public Key to VPS

**Linux/macOS:**
```bash
sshpass -p "Buryar@2020#" ssh-copy-id -i ~/.ssh/id_rsa_github_actions.pub root@31.97.58.62
```

**Windows (using PowerShell):**
```powershell
# Read the public key
$publicKey = Get-Content ~/.ssh/id_rsa_github_actions.pub

# Copy to VPS (you'll need to enter password)
ssh root@31.97.58.62 "mkdir -p ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Or manually:
1. Copy the content of `~/.ssh/id_rsa_github_actions.pub`
2. SSH to your VPS: `ssh root@31.97.58.62`
3. Run: `mkdir -p ~/.ssh && nano ~/.ssh/authorized_keys`
4. Paste the public key and save
5. Run: `chmod 600 ~/.ssh/authorized_keys`

#### Step 3: Get the Private Key

**Linux/macOS:**
```bash
cat ~/.ssh/id_rsa_github_actions
```

**Windows:**
```powershell
Get-Content ~/.ssh/id_rsa_github_actions
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

#### Step 4: Add to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. **Name**: `VPS_SSH_PRIVATE_KEY`
5. **Value**: Paste the entire private key (from Step 3)
6. Click **"Add secret"**

## ✅ Verify Setup

Test the SSH connection:

```bash
ssh -i ~/.ssh/id_rsa_github_actions root@31.97.58.62 "echo 'SSH connection successful!'"
```

If this works, your setup is complete!

## 🔒 Security Notes

- **Never commit the private key** to your repository
- The private key should only be stored in GitHub Secrets
- Keep your private key secure on your local machine
- If the key is compromised, generate a new one and update GitHub Secrets

## 🐛 Troubleshooting

### "Permission denied (publickey)" error

1. Verify the public key is in `~/.ssh/authorized_keys` on the VPS
2. Check file permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Verify SSH service is running: `systemctl status sshd`

### "Host key verification failed"

Add the VPS to known hosts:
```bash
ssh-keyscan -H 31.97.58.62 >> ~/.ssh/known_hosts
```

### GitHub Actions still fails

1. Double-check the secret name is exactly: `VPS_SSH_PRIVATE_KEY`
2. Ensure the private key includes the header and footer lines
3. Make sure there are no extra spaces or line breaks
4. Try regenerating the key and updating the secret

## 📝 Next Steps

Once the SSH key is set up:
1. Push your changes to trigger the deployment
2. Check the GitHub Actions tab to see the deployment progress
3. Your services will be automatically deployed to the VPS!

