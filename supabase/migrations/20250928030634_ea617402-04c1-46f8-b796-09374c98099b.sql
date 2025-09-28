-- Add extra_info column to daily_entries table to store range information for Quran entries
ALTER TABLE daily_entries 
ADD COLUMN extra_info TEXT;