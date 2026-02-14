# NYC Coffee — AI Voice Cashier

AI voice cashier for a busy NYC coffee shop: customers order by voice or text, baristas see a ticket queue, and the owner gets a data dashboard.

## Features

- **Customer view** — Conversational ordering (voice or text) with the AI cashier. Clarifying questions for size, temp, milk, sweetness, ice. Order receipt in chat. Voice uses ElevenLabs STT/TTS.
- **Barista view** — Order ticket queue; mark tickets **In progress** or **Completed**.
- **Owner dashboard** — Today’s orders, completed count, revenue, top items, peak hour, order history table, and **Export orders.csv**.

## Tech stack

- **App:** Next.js 15 (App Router), React 19, TypeScript, Tailwind
- **Database:** Supabase (PostgreSQL)
- **LLM:** OpenAI (GPT-4o-mini)
- **Voice:** ElevenLabs (speech-to-text, text-to-speech)
- **Hosting:** Railway (recommended)

## Setup

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd nyc-coffee-ai-cashier
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run the contents of `supabase/schema.sql` to create the `orders` table.
   - Copy the project URL and anon key from Settings → API.

3. **Environment**
   - Copy `.env.example` to `.env.local`.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Set `OPENAI_API_KEY` for the chat.
   - Optionally set `ELEVENLABS_API_KEY` (and `ELEVENLABS_VOICE_ID`) for voice; without them, ordering is text-only.

4. **Menu image**
   - Ensure `Coffee Menu.png` is in the project root; it’s copied to `public/` for the customer view. If you only have it in root, run:  
     `cp "Coffee Menu.png" public/`

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use **Order** (customer), **Barista**, and **Dashboard** (owner).

## Deploy on Railway

1. Push the repo to GitHub.
2. In [Railway](https://railway.app), New Project → Deploy from GitHub repo.
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, and optionally `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.
4. Build command: `npm run build`. Start command: `npm start`. Root directory: project root.
5. Deploy. Railway will assign a URL.

## Data

- **orders** are stored in Supabase and persist across sessions and deployments.
- **orders.csv** in the repo shows the data structure with sample rows; the Owner dashboard can export a full `orders.csv` for records.

## Menu and rules

The AI follows the NYC Coffee menu (see `Coffee Menu.png` and `lib/menu.ts`), including:

- Coffee Frappuccino is iced only.
- “Latte with no espresso” is treated as milk; the AI suggests alternatives.
- Max 4 espresso shots per drink.
- Sizes: Small (12oz), Large (16oz). Add-ons and pastries are as on the menu.

No payment flow; assume payment in-store.
