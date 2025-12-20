# ⚡ Quick SSH Key Setup

The Git Mirror deployment requires an SSH key to access your VPS. Follow these steps:

> **Note:** This is for Git Mirror setup. If you're using GitHub Actions (deprecated), the process is similar.

## 🎯 Step-by-Step Setup

### 1. Generate SSH Key

**Windows (Git Bash or PowerShell):**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_github_actions -N "" -C "github-actions-deploy"
```

**Linux/macOS:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_github_actions -N "" -C "github-actions-deploy"
```

### 2. Copy Public Key to VPS

**Option A: Using sshpass (if installed)**
```bash
sshpass -p "Buryar@2020#" ssh-copy-id -i ~/.ssh/id_rsa_github_actions.pub root@72.62.51.50
```

**Option B: Manual (recommended)**
```bash
# 1. Display your public key
cat ~/.ssh/id_rsa_github_actions.pub

# 2. Copy the output (starts with ssh-rsa...)

# 3. SSH to your VPS
ssh root@72.62.51.50

# 4. On the VPS, run:
mkdir -p ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### 3. Get Your Private Key

```bash
# Display the private key
cat ~/.ssh/id_rsa_github_actions
```

**Copy the ENTIRE output** including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the key content
- `-----END OPENSSH PRIVATE KEY-----`

### 4. Add to GitHub Secrets

1. Go to: **https://github.com/abdirahmanburyar/FAYO/settings/secrets/actions**
2. Click **"New repository secret"**
3. **Name**: `VPS_SSH_PRIVATE_KEY` (exactly this name)
4. **Value**: Paste the entire private key from step 3
5. Click **"Add secret"**

### 5. Test the Setup

```bash
ssh -i ~/.ssh/id_rsa_github_actions root@72.62.51.50 "echo 'Success!'"
```

If this works, you're all set! 🎉

## 📋 Direct Links

- **GitHub Secrets**: https://github.com/abdirahmanburyar/FAYO/settings/secrets/actions
- **VPS IP**: 72.62.51.50
- **VPS User**: root
- **VPS Password**: Buryar@2020#

## ⚠️ Important

- **Never commit** the private key to your repository
- The private key should **only** be in GitHub Secrets
- Keep your local private key file secure

## 🆘 Need Help?

See [SETUP_SSH_KEY.md](./SETUP_SSH_KEY.md) for detailed instructions and troubleshooting.

