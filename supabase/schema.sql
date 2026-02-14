-- Run this in Supabase SQL Editor to create the orders table.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Allow anonymous read/write for demo (use RLS in production).
alter table public.orders enable row level security;

create policy "Allow all for orders"
  on public.orders for all
  using (true)
  with check (true);
