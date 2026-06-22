# Quick Notes - Vercel Deployment Guide

## Step 1: Push to GitHub

### 1.1 Create a GitHub Repository
1. Go to https://github.com/new
2. **Repository name**: `quicknotes` (or your preferred name)
3. **Description**: `Quick Notes - A Next.js app for managing notes with Supabase`
4. Select **Public** (unless you want Private)
5. Click **Create repository**
6. Copy the HTTPS URL (e.g., `https://github.com/YOUR_USERNAME/quicknotes.git`)

### 1.2 Commit and Push Locally
Open PowerShell in your `c:\Users\Sejal Pandey\quicknotes` directory and run:

```bash
# Stage all changes
git add .

# Commit
git commit -m "Initial commit: Quick Notes app with Supabase integration"

# Add GitHub remote (replace URL with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/quicknotes.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Expected result**: All files appear in your GitHub repository.

---

## Step 2: Deploy to Vercel

### 2.1 Connect Vercel to GitHub
1. Go to https://vercel.com/import
2. Click **Import Project**
3. Select **Import Git Repository**
4. Paste your GitHub repo URL: `https://github.com/YOUR_USERNAME/quicknotes`
5. Click **Continue**

### 2.2 Authorize Vercel
- You'll be asked to authorize Vercel to access your GitHub account
- Click **Authorize** and follow GitHub's OAuth flow
- After auth, select your `quicknotes` repository

### 2.3 Configure Build Settings
Vercel will auto-detect Next.js. Settings should be:

- **Framework**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

**These are all correct—click Continue or Deploy.**

### 2.4 Add Environment Variables
**Important**: Before deploying, add your Supabase credentials.

1. On the environment variables screen, add:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your actual Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your actual Supabase anonymous key |

2. Find these values in Supabase:
   - Go to **Settings** → **API** in your Supabase project
   - Copy `Project URL` → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Click **Deploy**

### 2.5 Wait for Deployment
- Vercel will build and deploy your app
- You'll see a progress indicator
- Deployment typically takes 1-2 minutes
- Once complete, you'll get a URL like `https://quicknotes-abc123.vercel.app`

---

## Step 3: Verify the Deployment

### 3.1 Test the App
1. Open the Vercel deployment URL in your browser
2. Try to **add a note** → should work if Supabase RLS is configured
3. Try to **delete a note** → confirm it removes from the list
4. Refresh the page → notes should persist from Supabase

### 3.2 Check Vercel Logs
If there are issues:
1. Go to your Vercel project dashboard
2. Click on the latest deployment
3. Go to **Logs** → **Runtime Log**
4. Look for error messages

---

## Step 4: Automatic Redeployments

### How It Works
- Any `push` to `main` branch = automatic redeploy
- Preview deployments for feature branches (optional)

### Example Workflow

```bash
# Make a local change (e.g., update pages/index.js)
# Commit and push
git add pages/index.js
git commit -m "Update note UI"
git push origin main

# Vercel automatically detects the push and redeploys
# Check deployment status in Vercel dashboard
```

### For Feature Development
Create a branch:

```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
```

Vercel creates a **preview deployment** automatically. Once tested:

```bash
git checkout main
git merge feature/new-feature
git push origin main
```

Main branch redeploys to production.

---

## Step 5: Common Issues & Solutions

### Issue: "Could not find the table 'public.notes'"
**Fix**: Ensure your Supabase `notes` table exists in the `public` schema.

```sql
select * from public.notes limit 1;
```

### Issue: "Row-level security policy" error
**Fix**: Add RLS policies in Supabase SQL editor:

```sql
create policy "Allow select from notes" on public.notes
  for select using (true);

create policy "Allow insert into notes" on public.notes
  for insert with check (true);

create policy "Allow delete from notes" on public.notes
  for delete using (true);
```

Or disable RLS for the `notes` table in table settings (not recommended for production).

### Issue: Vercel shows build errors
1. Check **Logs** → **Build Log**
2. Verify environment variables are correctly set
3. Ensure `package.json` and `package-lock.json` are committed

---

## Step 6: Custom Domain (Optional)

1. Go to Vercel project settings → **Domains**
2. Add your custom domain (e.g., `quicknotes.com`)
3. Follow DNS setup instructions
4. SSL certificate auto-provisions within 48 hours

---

## Summary

✅ GitHub repo created  
✅ Code pushed to GitHub  
✅ Connected to Vercel  
✅ Environment variables added  
✅ App deployed  
✅ Auto-redeployment on push enabled  

Your Quick Notes app is now live and production-ready!

---

## Support
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
