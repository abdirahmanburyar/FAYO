# SSH Key Setup for Git Mirror

This guide will help you set up the SSH key needed for automatic deployment to your VPS using Git Mirror.

> **Note:** This setup is for Git Mirror (recommended). GitHub Actions deployment is deprecated.

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
3. Test the SSH connection

### Option 2: Manual Setup

#### Step 1: Generate SSH Key

**Linux/macOS:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_vps -N "" -C "vps-deploy"
```

**Windows (Git Bash):**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_vps -N "" -C "vps-deploy"
```

#### Step 2: Copy Public Key to VPS

**Linux/macOS:**
```bash
sshpass -p "Buryar@2020#" ssh-copy-id -i ~/.ssh/id_rsa_vps.pub root@72.62.51.50
```

**Windows (using PowerShell):**
```powershell
# Read the public key
$publicKey = Get-Content ~/.ssh/id_rsa_vps.pub

# Copy to VPS (you'll need to enter password)
ssh root@72.62.51.50 "mkdir -p ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Or manually:
1. Copy the content of `~/.ssh/id_rsa_vps.pub`
2. SSH to your VPS: `ssh root@72.62.51.50`
3. Run: `mkdir -p ~/.ssh && nano ~/.ssh/authorized_keys`
4. Paste the public key and save
5. Run: `chmod 600 ~/.ssh/authorized_keys`

#### Step 3: Configure SSH to Use This Key

**Linux/macOS/Windows:**
Add to `~/.ssh/config`:
```
Host 72.62.51.50
    HostName 72.62.51.50
    User root
    IdentityFile ~/.ssh/id_rsa_vps
    IdentitiesOnly yes
```

This allows you to SSH without specifying the key each time.

## ✅ Verify Setup

Test the SSH connection:

```bash
ssh root@72.62.51.50 "echo 'SSH connection successful!'"
```

Or if you haven't configured SSH config:
```bash
ssh -i ~/.ssh/id_rsa_vps root@72.62.51.50 "echo 'SSH connection successful!'"
```

If this works, your setup is complete!

## 🔒 Security Notes

- **Never commit the private key** to your repository
- Keep your private key secure on your local machine
- Use proper file permissions: `chmod 600 ~/.ssh/id_rsa_vps`
- If the key is compromised, generate a new one and remove the old public key from VPS

## 🐛 Troubleshooting

### "Permission denied (publickey)" error

1. Verify the public key is in `~/.ssh/authorized_keys` on the VPS
2. Check file permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Verify SSH service is running: `systemctl status sshd`

### "Host key verification failed"

Add the VPS to known hosts:
```bash
ssh-keyscan -H 72.62.51.50 >> ~/.ssh/known_hosts
```

### Git Push still fails

1. Double-check SSH key permissions: `chmod 600 ~/.ssh/id_rsa_vps`
2. Ensure the public key is in VPS `~/.ssh/authorized_keys`
3. Test connection: `ssh root@72.62.51.50` (or `ssh -i ~/.ssh/id_rsa_vps root@72.62.51.50`)
4. Check git remote: `git remote -v` (should show `vps` remote)
5. Verify SSH config is set up correctly

## 📝 Next Steps

Once the SSH key is set up:
1. Run the Git Mirror setup: `./scripts/setup-git-mirror.sh`
2. Commit your changes - they'll automatically push to VPS
3. Your services will be automatically deployed to the VPS!

See [Git Mirror Setup Guide](./GIT_MIRROR_SETUP.md) for complete instructions.

