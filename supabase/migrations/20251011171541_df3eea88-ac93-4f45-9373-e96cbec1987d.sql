-- Add columns to auth_page_settings for headline and subheadline customization
ALTER TABLE auth_page_settings 
ADD COLUMN headline_text TEXT DEFAULT 'Lost Your Dhikr Count Again? Forgot Your Nafl Prayers? Can''t Remember Yesterday''s Surah?',
ADD COLUMN subheadline_text TEXT DEFAULT 'You''re not alone. Finally, track your daily worship without the frustration. My Dhikr app keeps everything organized with simple taps.',
ADD COLUMN headline_font_size TEXT DEFAULT '3xl',
ADD COLUMN headline_color TEXT DEFAULT 'hsl(var(--foreground))',
ADD COLUMN subheadline_font_size TEXT DEFAULT 'lg',
ADD COLUMN subheadline_color TEXT DEFAULT 'hsl(var(--muted-foreground))',
ADD COLUMN highlight_words TEXT,
ADD COLUMN highlight_color TEXT DEFAULT 'hsl(var(--primary))',
ADD COLUMN headline_width TEXT DEFAULT '592px',
ADD COLUMN subheadline_width TEXT DEFAULT '592px';