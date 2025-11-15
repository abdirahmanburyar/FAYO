# GitHub Secret Setup - Quick Guide

## 🔐 Required Secret

You need to add the VPS password as a GitHub secret for the CI/CD pipeline to work.

### Step 1: Go to GitHub Secrets

Open this link in your browser:
**https://github.com/abdirahmanburyar/FAYO/settings/secrets/actions**

### Step 2: Add the Secret

1. Click **"New repository secret"** button
2. **Name**: `VPS_SSH_PASSWORD` (exactly this name, case-sensitive)
3. **Value**: `Buryar@2020#`
4. Click **"Add secret"**

### Step 3: Verify

After adding the secret, you should see `VPS_SSH_PASSWORD` in your secrets list.

## ✅ That's It!

Once the secret is added, your GitHub Actions workflow will be able to:
- Connect to your VPS (31.97.58.62)
- Deploy your services automatically
- Run deployment commands

## 🚀 Next Steps

After adding the secret:
1. Push any changes to trigger the workflow
2. Go to the **Actions** tab in your GitHub repository
3. Watch your deployment in real-time!

## 🔒 Security Note

- The password is stored securely in GitHub Secrets
- It's encrypted and only accessible to GitHub Actions
- Never commit passwords directly in your code

