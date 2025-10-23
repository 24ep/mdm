-- Add default_space_id field to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_default_space_id ON public.users(default_space_id);

-- Update existing users to have the default space as their default_space_id
UPDATE public.users 
SET default_space_id = (
  SELECT id FROM public.spaces 
  WHERE is_default = true AND deleted_at IS NULL 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE default_space_id IS NULL;
