-- Add ip_address and user_agent columns to audit_logs table
-- This migration adds the missing columns that are referenced in src/lib/audit.ts

DO $$ 
BEGIN
  -- Add ip_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN ip_address TEXT;
  END IF;
  
  -- Add user_agent column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
  END IF;
END $$;

