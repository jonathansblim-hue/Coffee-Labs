# Publish to GitHub & Deploy on Railway

## Part 1: Publish to GitHub

### 1. Initialize Git and make the first commit

```bash
cd "/Users/jonathanlim/Documents/Coffee Labs"
git add .
git commit -m "NYC Coffee AI cashier — full app"
```

### 2. Create the repo on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `Coffee-Labs`
3. Choose **Public**
4. **Do not** add a README, .gitignore, or license (you already have these)
5. Click **Create repository**

### 3. Connect and push

```bash
git remote add origin https://github.com/YOUR_USERNAME/Coffee-Labs.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy on Railway

### 1. Create a new project

1. Go to **https://railway.app** and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `Coffee-Labs` repository
4. Railway auto-detects the Dockerfile and starts building

### 2. Add environment variables

Go to your service → **Variables** tab. Add these:

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Same place |
| `GOOGLE_GENAI_API_KEY` | Your Gemini API key | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `ELEVENLABS_API_KEY` | (optional) Your ElevenLabs key | For voice; omit for text-only |
| `ELEVENLABS_VOICE_ID` | (optional) e.g. `21m00Tcm4TlvDq8ikWAM` | Optional |

### 3. Generate a public domain

1. Go to your service → **Settings** → **Networking**
2. Click **Generate Domain** to get a `.up.railway.app` URL

### 4. Redeploy after adding variables

If you added variables after the first deploy, Railway should auto-redeploy. If not, click **Deploy** or push a new commit.

---

## Checklist

- [ ] Repo pushed to GitHub (public, with `orders.csv`)
- [ ] Railway project created and linked to the repo
- [ ] Environment variables set in Railway
- [ ] Domain generated and app is live
- [ ] Test all three views: Order, Barista, Dashboard
