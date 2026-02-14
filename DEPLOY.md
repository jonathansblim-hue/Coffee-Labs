# Publish to GitHub & Deploy on Railway

## Part 1: Publish to GitHub

### 1. Initialize Git and make the first commit (do this once)

In a terminal, from your project folder:

```bash
cd "/Users/jonathanlim/Documents/Coffee Labs"

# Start tracking the project
git init

# Stage everything ( .env.local is ignored and won’t be committed)
git add .

# First commit
git commit -m "Initial commit: NYC Coffee AI cashier"
```

### 2. Create the repo on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** e.g. `nyc-coffee-ai-cashier` (or any name you like)
3. Choose **Public**
4. **Do not** add a README, .gitignore, or license (you already have these)
5. Click **Create repository**

### 3. Connect your project and push

GitHub will show “Quick setup” commands. Use these (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Example: if your repo is `https://github.com/jonathanlim/nyc-coffee`, then:

```bash
git remote add origin https://github.com/jonathanlim/nyc-coffee.git
git branch -M main
git push -u origin main
```

`orders.csv` is already in the project, so it will be in the repo after you push.

---

## Part 2: Deploy on Railway

### 1. Create a Railway project

1. Go to **https://railway.app** and sign in (e.g. with GitHub).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Select the repo you just pushed (e.g. `nyc-coffee-ai-cashier`).
5. Railway will detect Next.js and use default build/start; you’ll set env vars next.

### 2. Add environment variables

1. In your Railway project, open your **service** (the one that was created from the repo).
2. Go to the **Variables** tab (or **Settings** → **Variables**).
3. Add the same variables you use in `.env.local` (use **Add Variable** or **Bulk Add**):

   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/publishable key  
   - `OPENAI_API_KEY` = your OpenAI API key  

   Optional (for voice):

   - `ELEVENLABS_API_KEY`  
   - `ELEVENLABS_VOICE_ID` = `21m00Tcm4TlvDq8ikWAM`  

4. Save. Railway will redeploy with the new variables.

### 3. Set build and start commands (if needed)

Railway usually auto-detects Next.js. If it doesn’t:

1. Open your service → **Settings** (or the **Build** / **Deploy** section).
2. Set **Build Command:** `npm run build`
3. Set **Start Command:** `npm start`
4. **Root Directory:** leave blank (project root).

### 4. Get your live URL

1. In your service, open the **Settings** tab.
2. Under **Networking** or **Domains**, click **Generate Domain** (or **Add domain**).
3. Copy the URL (e.g. `https://your-app.up.railway.app`) and open it in a browser.

Your app is now live. Orders still use the same Supabase project, so data is shared between local and deployed app.

---

## Checklist

- [ ] `git init` and first commit done
- [ ] GitHub repo created (public)
- [ ] `git remote add origin` and `git push` done
- [ ] Railway project created from that GitHub repo
- [ ] Env vars added in Railway (Supabase URL/key, OpenAI key)
- [ ] Domain generated and live URL opened
