-- ============================================
-- ADD ADDRESS COLUMN TO STUDENT PROFILES
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
