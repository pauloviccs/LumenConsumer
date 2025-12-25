-- 1. Enable RLS (Good practice, but we will open it for MVP)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 2. Create Policy for Anon Access (Since we don't have User Auth yet)
-- Allow Select/Insert/Update for everyone with the Anon Key
create policy "Enable access for all users" on public.orders for all using (true) with check (true);
create policy "Enable access for all users" on public.order_items for all using (true) with check (true);

-- 3. Fix Realtime Publication
alter publication supabase_realtime set table public.orders, public.order_items;
