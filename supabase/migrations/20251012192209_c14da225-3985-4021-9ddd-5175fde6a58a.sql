-- Create table for managing islamic options
CREATE TABLE public.islamic_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('dhikr', 'quran', 'salah')),
  name text NOT NULL,
  sequence_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, name)
);

-- Enable RLS
ALTER TABLE public.islamic_options ENABLE ROW LEVEL SECURITY;

-- Create policies for islamic_options
CREATE POLICY "Anyone can view active options"
ON public.islamic_options
FOR SELECT
USING (is_active = true OR EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "Only admins can insert options"
ON public.islamic_options
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "Only admins can update options"
ON public.islamic_options
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "Only admins can delete options"
ON public.islamic_options
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_islamic_options_updated_at
BEFORE UPDATE ON public.islamic_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing options
INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('dhikr', 'Istegfar + Durood', 1),
  ('dhikr', 'Subhan Allah', 2),
  ('dhikr', 'Alhamdulillah', 3),
  ('dhikr', 'Allahu Akbar', 4),
  ('dhikr', 'La ilaha illa Allah', 5),
  ('dhikr', 'Astaghfirullah', 6),
  ('dhikr', 'Salawat (Durood)', 7),
  ('dhikr', 'Istighfar', 8),
  ('dhikr', 'Dhikr al-Sabah (Morning)', 9),
  ('dhikr', 'Dhikr al-Masa (Evening)', 10);

-- Insert Salah options
INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('salah', 'Tahajjud', 1),
  ('salah', 'Ishraq', 2),
  ('salah', 'Duha', 3),
  ('salah', 'Awwabin', 4),
  ('salah', 'Tahiyyat al-Masjid', 5),
  ('salah', 'Sunnah Fajr', 6),
  ('salah', 'Sunnah Dhuhr', 7),
  ('salah', 'Sunnah Asr', 8),
  ('salah', 'Sunnah Maghrib', 9),
  ('salah', 'Sunnah Isha', 10),
  ('salah', 'Witr', 11),
  ('salah', 'Istikharah', 12),
  ('salah', 'Tawbah (Repentance)', 13),
  ('salah', 'Hajah (Need)', 14),
  ('salah', 'Shukr (Gratitude)', 15);

-- Insert Quran options (first batch)
INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('quran', '1. Al-Fatiha (7 verses)', 1),
  ('quran', '2. Al-Baqarah (286 verses)', 2),
  ('quran', '3. Ali ''Imran (200 verses)', 3),
  ('quran', '4. An-Nisa (176 verses)', 4),
  ('quran', '5. Al-Ma''idah (120 verses)', 5),
  ('quran', '6. Al-An''am (165 verses)', 6),
  ('quran', '7. Al-A''raf (206 verses)', 7),
  ('quran', '8. Al-Anfal (75 verses)', 8),
  ('quran', '9. At-Tawbah (129 verses)', 9),
  ('quran', '10. Yunus (109 verses)', 10),
  ('quran', '11. Hud (123 verses)', 11),
  ('quran', '12. Yusuf (111 verses)', 12),
  ('quran', '13. Ar-Ra''d (43 verses)', 13),
  ('quran', '14. Ibrahim (52 verses)', 14),
  ('quran', '15. Al-Hijr (99 verses)', 15),
  ('quran', '16. An-Nahl (128 verses)', 16),
  ('quran', '17. Al-Isra (111 verses)', 17),
  ('quran', '18. Al-Kahf (110 verses)', 18),
  ('quran', '19. Maryam (98 verses)', 19),
  ('quran', '20. Ta-Ha (135 verses)', 20);

-- Continue with more Quran surahs
INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('quran', '21. Al-Anbiya (112 verses)', 21),
  ('quran', '22. Al-Hajj (78 verses)', 22),
  ('quran', '23. Al-Mu''minun (118 verses)', 23),
  ('quran', '24. An-Nur (64 verses)', 24),
  ('quran', '25. Al-Furqan (77 verses)', 25),
  ('quran', '26. Ash-Shu''ara (227 verses)', 26),
  ('quran', '27. An-Naml (93 verses)', 27),
  ('quran', '28. Al-Qasas (88 verses)', 28),
  ('quran', '29. Al-''Ankabut (69 verses)', 29),
  ('quran', '30. Ar-Rum (60 verses)', 30),
  ('quran', '31. Luqman (34 verses)', 31),
  ('quran', '32. As-Sajdah (30 verses)', 32),
  ('quran', '33. Al-Ahzab (73 verses)', 33),
  ('quran', '34. Saba (54 verses)', 34),
  ('quran', '35. Fatir (45 verses)', 35),
  ('quran', '36. Ya-Sin (83 verses)', 36),
  ('quran', '37. As-Saffat (182 verses)', 37),
  ('quran', '38. Sad (88 verses)', 38),
  ('quran', '39. Az-Zumar (75 verses)', 39),
  ('quran', '40. Ghafir (85 verses)', 40);

INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('quran', '41. Fussilat (54 verses)', 41),
  ('quran', '42. Ash-Shuraa (53 verses)', 42),
  ('quran', '43. Az-Zukhruf (89 verses)', 43),
  ('quran', '44. Ad-Dukhan (59 verses)', 44),
  ('quran', '45. Al-Jathiyah (37 verses)', 45),
  ('quran', '46. Al-Ahqaf (35 verses)', 46),
  ('quran', '47. Muhammad (38 verses)', 47),
  ('quran', '48. Al-Fath (29 verses)', 48),
  ('quran', '49. Al-Hujurat (18 verses)', 49),
  ('quran', '50. Qaf (45 verses)', 50),
  ('quran', '51. Adh-Dhariyat (60 verses)', 51),
  ('quran', '52. At-Tur (49 verses)', 52),
  ('quran', '53. An-Najm (62 verses)', 53),
  ('quran', '54. Al-Qamar (55 verses)', 54),
  ('quran', '55. Ar-Rahman (78 verses)', 55),
  ('quran', '56. Al-Waqi''ah (96 verses)', 56),
  ('quran', '57. Al-Hadid (29 verses)', 57),
  ('quran', '58. Al-Mujadila (22 verses)', 58),
  ('quran', '59. Al-Hashr (24 verses)', 59),
  ('quran', '60. Al-Mumtahanah (13 verses)', 60);

INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('quran', '61. As-Saff (14 verses)', 61),
  ('quran', '62. Al-Jumu''ah (11 verses)', 62),
  ('quran', '63. Al-Munafiqun (11 verses)', 63),
  ('quran', '64. At-Taghabun (18 verses)', 64),
  ('quran', '65. At-Talaq (12 verses)', 65),
  ('quran', '66. At-Tahrim (12 verses)', 66),
  ('quran', '67. Al-Mulk (30 verses)', 67),
  ('quran', '68. Al-Qalam (52 verses)', 68),
  ('quran', '69. Al-Haqqah (52 verses)', 69),
  ('quran', '70. Al-Ma''arij (44 verses)', 70),
  ('quran', '71. Nuh (28 verses)', 71),
  ('quran', '72. Al-Jinn (28 verses)', 72),
  ('quran', '73. Al-Muzzammil (20 verses)', 73),
  ('quran', '74. Al-Muddaththir (56 verses)', 74),
  ('quran', '75. Al-Qiyamah (40 verses)', 75),
  ('quran', '76. Al-Insan (31 verses)', 76),
  ('quran', '77. Al-Mursalat (50 verses)', 77),
  ('quran', '78. An-Naba (40 verses)', 78),
  ('quran', '79. An-Nazi''at (46 verses)', 79),
  ('quran', '80. ''Abasa (42 verses)', 80);

INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('quran', '81. At-Takwir (29 verses)', 81),
  ('quran', '82. Al-Infitar (19 verses)', 82),
  ('quran', '83. Al-Mutaffifin (36 verses)', 83),
  ('quran', '84. Al-Inshiqaq (25 verses)', 84),
  ('quran', '85. Al-Buruj (22 verses)', 85),
  ('quran', '86. At-Tariq (17 verses)', 86),
  ('quran', '87. Al-A''la (19 verses)', 87),
  ('quran', '88. Al-Ghashiyah (26 verses)', 88),
  ('quran', '89. Al-Fajr (30 verses)', 89),
  ('quran', '90. Al-Balad (20 verses)', 90),
  ('quran', '91. Ash-Shams (15 verses)', 91),
  ('quran', '92. Al-Layl (21 verses)', 92),
  ('quran', '93. Ad-Duhaa (11 verses)', 93),
  ('quran', '94. Ash-Sharh (8 verses)', 94),
  ('quran', '95. At-Tin (8 verses)', 95),
  ('quran', '96. Al-''Alaq (19 verses)', 96),
  ('quran', '97. Al-Qadr (5 verses)', 97),
  ('quran', '98. Al-Bayyinah (8 verses)', 98),
  ('quran', '99. Az-Zalzalah (8 verses)', 99),
  ('quran', '100. Al-''Adiyat (11 verses)', 100);

INSERT INTO public.islamic_options (category, name, sequence_order) VALUES
  ('quran', '101. Al-Qari''ah (11 verses)', 101),
  ('quran', '102. At-Takathur (8 verses)', 102),
  ('quran', '103. Al-''Asr (3 verses)', 103),
  ('quran', '104. Al-Humazah (9 verses)', 104),
  ('quran', '105. Al-Fil (5 verses)', 105),
  ('quran', '106. Quraysh (4 verses)', 106),
  ('quran', '107. Al-Ma''un (7 verses)', 107),
  ('quran', '108. Al-Kawthar (3 verses)', 108),
  ('quran', '109. Al-Kafirun (6 verses)', 109),
  ('quran', '110. An-Nasr (3 verses)', 110),
  ('quran', '111. Al-Masad (5 verses)', 111),
  ('quran', '112. Al-Ikhlas (4 verses)', 112),
  ('quran', '113. Al-Falaq (5 verses)', 113),
  ('quran', '114. An-Nas (6 verses)', 114),
  ('quran', 'Juz/Para (specify number)', 115),
  ('quran', 'General Pages', 116);