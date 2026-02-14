# Publish to GitHub & Deploy on Vercel

## Part 1: Publish to GitHub

### 1. Initialize Git and make the first commit (do this once)

In a terminal, from your project folder:

```bash
cd "/Users/jonathanlim/Documents/Coffee Labs"

git init
git add .
git commit -m "Initial commit: NYC Coffee AI cashier"
```

### 2. Create the repo on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** e.g. `Coffee-Labs` or `nyc-coffee-ai-cashier`
3. Choose **Public**
4. **Do not** add a README, .gitignore, or license (you already have these)
5. Click **Create repository**

### 3. Connect your project and push

Use the commands GitHub shows (replace with your username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Example:

```bash
git remote add origin https://github.com/jonathansblim-hue/Coffee-Labs.git
git branch -M main
git push -u origin main
```

`orders.csv` is already in the project and will be in the repo after you push.

---

## Part 2: Deploy on Vercel

### 1. Import the project

1. Go to **https://vercel.com** and sign in (e.g. with GitHub).
2. Click **Add New** → **Project**.
3. Import your GitHub repo (e.g. `Coffee-Labs`). Vercel will detect Next.js.

### 2. Add environment variables

Before or after the first deploy, open the project → **Settings** → **Environment Variables**. Add:

| Name | Value | Notes |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Same place |
| `GOOGLE_GENAI_API_KEY` | Your Gemini API key | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `ELEVENLABS_API_KEY` | (optional) ElevenLabs key | For voice; omit for text-only |
| `ELEVENLABS_VOICE_ID` | (optional) e.g. `21m00Tcm4TlvDq8ikWAM` | Optional |

Apply to **Production** (and Preview if you want). Save.

### 3. Deploy

- If you added variables before deploying: click **Deploy** on the import screen.
- If the project already exists: push a commit to trigger a new deploy, or go to **Deployments** → **Redeploy** (and optionally “Redeploy with existing Build Cache” off so env is fresh).

### 4. Get your live URL

After the deploy finishes, Vercel shows a URL like `https://your-project.vercel.app`. Open it to use the app. You can add a custom domain under **Settings** → **Domains**.

---

## Checklist

- [ ] Repo pushed to GitHub (with `orders.csv`)
- [ ] Vercel project created and linked to the repo
- [ ] Env vars set in Vercel (Supabase URL/key, `GOOGLE_GENAI_API_KEY`, optional ElevenLabs)
- [ ] Deploy succeeded and live URL works
