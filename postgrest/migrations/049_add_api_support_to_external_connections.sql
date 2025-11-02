-- Add API endpoint support to external connections
BEGIN;

-- Add connection_type to distinguish between 'database' and 'api'
ALTER TABLE public.external_connections
  ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'database' CHECK (connection_type IN ('database', 'api'));

-- Add API-specific fields
ALTER TABLE public.external_connections
  ADD COLUMN IF NOT EXISTS api_url TEXT,
  ADD COLUMN IF NOT EXISTS api_method TEXT DEFAULT 'GET' CHECK (api_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  ADD COLUMN IF NOT EXISTS api_headers JSONB,
  ADD COLUMN IF NOT EXISTS api_auth_type TEXT CHECK (api_auth_type IN ('none', 'bearer', 'basic', 'apikey')),
  ADD COLUMN IF NOT EXISTS api_auth_token TEXT,
  ADD COLUMN IF NOT EXISTS api_auth_username TEXT,
  ADD COLUMN IF NOT EXISTS api_auth_password TEXT,
  ADD COLUMN IF NOT EXISTS api_auth_apikey_name TEXT,
  ADD COLUMN IF NOT EXISTS api_auth_apikey_value TEXT,
  ADD COLUMN IF NOT EXISTS api_body TEXT,
  ADD COLUMN IF NOT EXISTS api_response_path TEXT, -- JSON path to extract data (e.g., "data.items")
  ADD COLUMN IF NOT EXISTS api_pagination_type TEXT CHECK (api_pagination_type IN ('none', 'offset', 'cursor', 'page')),
  ADD COLUMN IF NOT EXISTS api_pagination_config JSONB;

-- Update existing connections to have connection_type = 'database'
UPDATE public.external_connections
SET connection_type = 'database'
WHERE connection_type IS NULL;

-- Make db_type nullable for API connections (it's only needed for database connections)
-- But we'll keep it as NOT NULL for now to avoid breaking existing code
-- We can make it nullable later if needed

COMMIT;

