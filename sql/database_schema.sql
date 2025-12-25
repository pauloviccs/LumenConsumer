-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_phone text not null,
  customer_name text,
  status text not null check (status in ('pending_payment', 'paid', 'preparing', 'ready', 'delivering', 'completed', 'cancelled')),
  total_amount numeric(10, 2) not null,
  payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Order Items Table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_name text not null,
  quantity integer not null,
  price numeric(10, 2) not null,
  notes text
);

-- 3. Create Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric(10, 2) not null,
  category text,
  is_available boolean default true
);

-- 4. Enable Realtime
alter publication supabase_realtime add table public.orders;

-- 5. Insert Dummy Data for Testing
insert into public.orders (customer_phone, customer_name, status, total_amount)
values 
('5511999999999', 'Teste Inicial', 'paid', 50.00);
