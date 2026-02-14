# Supabase setup (next steps)

## 1. Create the `orders` table

1. In your Supabase project, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Copy the entire contents of `supabase/schema.sql` and paste into the editor.
4. Click **Run** (or press Cmd+Enter). You should see “Success. No rows returned.”

Your database now has an `orders` table with the right columns and permissions.

---

## 2. Get your project URL and anon key

1. In Supabase, go to **Project Settings** (gear icon in the left sidebar).
2. Open **API** in the settings menu.
3. Copy:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon public** → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Add them to your app

1. In the Coffee Labs project folder, copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and replace the placeholders:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL (e.g. `https://xxxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key (long string starting with `eyJ...`)

Save the file.

---

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000. Place an order on the **Order** page; it will be stored in Supabase. Check **Barista** to see the ticket and **Dashboard** to see the order.

You’ll also need `OPENAI_API_KEY` in `.env.local` for the AI cashier to respond. Add `ELEVENLABS_API_KEY` (and optionally `ELEVENLABS_VOICE_ID`) if you want voice input/output.
