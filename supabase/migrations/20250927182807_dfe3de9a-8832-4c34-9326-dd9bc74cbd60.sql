-- Add email column to profiles table so admins can see user emails
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update existing profiles with emails from metadata if available
-- Note: This will be empty for existing users, but new users will have emails stored