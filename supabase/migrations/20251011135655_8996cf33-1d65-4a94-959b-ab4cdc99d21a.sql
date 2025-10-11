-- Create a table for auth page video settings
CREATE TABLE public.auth_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_page_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the settings (public page)
CREATE POLICY "Anyone can view auth page settings"
ON public.auth_page_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- Only admins can update the settings
CREATE POLICY "Only admins can update auth page settings"
ON public.auth_page_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert settings
CREATE POLICY "Only admins can insert auth page settings"
ON public.auth_page_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert initial empty setting
INSERT INTO public.auth_page_settings (video_url) VALUES ('');

-- Create trigger for updated_at
CREATE TRIGGER update_auth_page_settings_updated_at
BEFORE UPDATE ON public.auth_page_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();