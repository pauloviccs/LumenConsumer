-- Add PIX fields to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cnpj'; -- cnpj, cpf, email, phone, random
