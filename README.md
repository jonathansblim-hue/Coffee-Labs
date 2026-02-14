# NYC Coffee — AI Voice Cashier

An AI-powered voice cashier for a busy NYC coffee shop. Customers order by voice or text through a conversational AI, baristas manage an order ticket queue, and the store owner gets a real-time business dashboard.

**Live demo:** [your-app.up.railway.app](https://your-app.up.railway.app)

---

## Features

### Customer View — Conversational Ordering
- Multi-turn voice or text conversation with the AI cashier
- Clarifying questions for size, temperature, milk, sweetness, ice level
- Handles modifications (oat milk, extra shot, less ice, etc.)
- Rejects impossible/unreasonable requests (hot frappuccino, 10 espresso shots, etc.)
- Posts a formatted order receipt in chat when the customer confirms
- Voice powered by ElevenLabs speech-to-text and text-to-speech

### Barista View — Order Ticket Queue
- Real-time order queue (auto-refreshes every 4 seconds)
- Readable ticket cards with all drink details and customizations
- Filter between active orders and completed orders
- Mark tickets as **In Progress** or **Completed**
- Visual urgency indicators for orders waiting too long
- Audio notification for new incoming orders

### Owner Dashboard — Business Intelligence
- Date range filters (Today, 7 Days, 30 Days, All Time)
- Key metrics: total orders, revenue, avg order value, avg fulfillment time
- Orders by hour bar chart (identify peak hours for staffing)
- Revenue trend line chart (track daily revenue)
- Top-selling items horizontal bar chart
- Category split donut chart (drinks vs pastries)
- Customer preferences: hot vs iced, milk choice breakdown
- Searchable order history table
- Export orders.csv for records

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| LLM | Google Gemini (2.0 Flash) |
| Voice | ElevenLabs (speech-to-text, text-to-speech) |
| Charts | Recharts |
| Hosting | Railway |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/Coffee-Labs.git
cd Coffee-Labs
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the contents of `supabase/schema.sql` to create the `orders` table
3. Copy the project URL and anon key from **Settings → API**

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `GOOGLE_GENAI_API_KEY` | Yes | Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey)) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for voice features |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID (default: Rachel) |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the nav to switch between **Order** (customer), **Barista**, and **Dashboard** (owner).

---

## Deploy on Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: NYC Coffee AI cashier"
git remote add origin https://github.com/YOUR_USERNAME/Coffee-Labs.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `Coffee-Labs` repository
4. Railway will auto-detect the Dockerfile

### 3. Add environment variables

In Railway, go to your service → **Variables** and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENAI_API_KEY`
- `ELEVENLABS_API_KEY` (optional)
- `ELEVENLABS_VOICE_ID` (optional)

### 4. Generate a domain

Go to **Settings** → **Networking** → **Generate Domain** to get a public URL.

---

## Data

- **Orders** are stored in Supabase and persist across sessions, reloads, and deployments
- **orders.csv** in the repo shows the data structure with sample rows
- The Owner Dashboard can export a live `orders.csv` at any time

---

## Menu & Business Rules

The AI cashier follows the NYC Coffee menu (see `lib/menu.ts`), including hidden rules:

- **Coffee Frappuccino is iced only** — if someone asks for it hot, the AI suggests iced or offers a hot alternative
- **"Latte with no espresso"** — the AI explains that's just milk and suggests alternatives
- **Max 4 espresso shots per drink** — politely declines requests for more
- Only valid sizes (Small 12oz / Large 16oz) and temperatures per drink
- Asks for missing details (size, temp, milk preference) before confirming
- No payment flow — assumes payment in-store

---

## Project Structure

```
├── app/
│   ├── page.tsx                  # Customer view (AI cashier chat)
│   ├── barista/page.tsx          # Barista view (order ticket queue)
│   ├── owner/page.tsx            # Owner view (data dashboard)
│   ├── api/
│   │   ├── chat/route.ts         # Gemini chat + order creation
│   │   ├── orders/route.ts       # GET/POST orders
│   │   ├── orders/[id]/route.ts  # PATCH order status
│   │   ├── speech-to-text/route.ts
│   │   └── text-to-speech/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/Nav.tsx
├── lib/
│   ├── menu.ts                   # Menu data and pricing
│   ├── prompt.ts                 # AI cashier system prompt
│   ├── supabase.ts               # Supabase client
│   └── types.ts                  # TypeScript types
├── supabase/schema.sql           # Database schema
├── orders.csv                    # Sample data structure
├── Dockerfile                    # Railway deployment
└── .env.example
```
