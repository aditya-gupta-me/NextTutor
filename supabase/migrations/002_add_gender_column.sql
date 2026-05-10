-- ============================================
-- Add gender to profiles
-- ============================================

ALTER TABLE public.tutor_profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other'));

ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other'));
