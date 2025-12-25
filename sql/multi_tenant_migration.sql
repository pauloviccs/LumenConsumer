-- 1. Create Tenants Table (The "Establishments")
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    evolution_instance_name TEXT, -- Stores the linked WhatsApp instance name
    evolution_api_key TEXT -- Stores the API Key for that instance
);

-- 2. Create Profiles Table (Mapping Auth User -> Tenant)
-- This allows us to know which tenant the logged-in user belongs to.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id),
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add tenant_id to existing tables
-- We use "IF NOT EXISTS" to create the column, but for the FK we might need separate statements or DO blocks if re-running.
-- For simplicity in this script, we assume a fresh run or compatible state.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tenant_id') THEN
        ALTER TABLE public.orders ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tenant_id') THEN
        ALTER TABLE public.products ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='tenant_id') THEN
        ALTER TABLE public.order_items ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- 4. Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function to get current user's tenant
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO current_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN current_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies (The "Isolation Forcefield")

-- Profiles: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Tenants: Users can read their own tenant info
DROP POLICY IF EXISTS "Users can read own tenant" ON public.tenants;
CREATE POLICY "Users can read own tenant" ON public.tenants
    FOR SELECT USING (id = public.get_current_tenant_id());

-- Orders: Users can ONLY see orders from their tenant
DROP POLICY IF EXISTS "Tenant Isolation for Orders" ON public.orders;
CREATE POLICY "Tenant Isolation for Orders" ON public.orders
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Products: Users can ONLY see products from their tenant
DROP POLICY IF EXISTS "Tenant Isolation for Products" ON public.products;
CREATE POLICY "Tenant Isolation for Products" ON public.products
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Order Items: Inherit isolation via Order or Tenant ID
DROP POLICY IF EXISTS "Tenant Isolation for Order Items" ON public.order_items;
CREATE POLICY "Tenant Isolation for Order Items" ON public.order_items
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- 7. Auto-create Profile on Signup (Trigger)
-- When a user signs up via Supabase Auth, we want to create a Profile (and potentially a Tenant) automatically.
-- For this MVP, we will assume manual tenant creation or a separate flow, 
-- BUT we need a Trigger to ensure the profile exists.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- 1. Create a new Tenant for every new user (1 User = 1 Restaurant model for now)
  INSERT INTO public.tenants (name)
  VALUES ('Restaurante de ' || NEW.email)
  RETURNING id INTO new_tenant_id;

  -- 2. Create the Profile linking User -> Tenant
  INSERT INTO public.profiles (id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

