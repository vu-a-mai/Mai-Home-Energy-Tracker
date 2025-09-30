# ⚡ Quick Deploy Guide

## 🚀 Option 1: Vercel GitHub Integration (Easiest)

### **Setup (5 minutes):**

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com
   - Click "Add New..." → "Project"
   - Import `mai-home-energy-tracker`
   - Set **Root Directory**: `web`
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Done!** ✅
   - Every push to `main` → Auto-deploys
   - Every PR → Preview deployment

---

## 🤖 Option 2: GitHub Actions (More Control)

### **Setup (10 minutes):**

1. **Get Vercel Credentials:**
   - Token: https://vercel.com/account/tokens
   - Project ID: Run `cd web && npx vercel link`

2. **Add GitHub Secrets:**
   - Go to: Repo → Settings → Secrets → Actions
   - Add these 5 secrets:
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Push Workflow:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add CI/CD workflow"
   git push origin main
   ```

4. **Done!** ✅
   - Check Actions tab for deployment status

---

## 📋 Required Secrets

| Secret | Where to Get It |
|--------|-----------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` or Vercel Settings |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` or Vercel Settings |
| `VITE_SUPABASE_URL` | Your `.env.local` file |
| `VITE_SUPABASE_ANON_KEY` | Your `.env.local` file |

---

## ✅ Verification

After deployment:
- [ ] Visit your Vercel URL
- [ ] Demo mode works
- [ ] Login page loads
- [ ] No console errors (F12)
- [ ] All pages accessible

---

## 🎯 Recommendation

**Use Option 1 (Vercel GitHub Integration)** unless you need:
- Custom build steps
- Automated tests
- Multiple environments
- Advanced deployment control

**It's simpler and works great for most projects!**

---

**Full details in `GITHUB_ACTIONS_SETUP.md`**
