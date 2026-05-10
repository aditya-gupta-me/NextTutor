-- Migration: Fix session-related RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Add 'message' column to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

-- 2. Drop any old problematic policies
DROP POLICY IF EXISTS "Tutors can read session student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can read tutor user rows" ON public.users;

-- 3. Create SECURITY DEFINER helper to check if tutor has session with student
CREATE OR REPLACE FUNCTION public.tutor_has_session_with_student(p_student_profile_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.tutor_profiles tp ON s.tutor_profile_id = tp.id
    WHERE s.student_profile_id = p_student_profile_id
    AND tp.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Create SECURITY DEFINER helper to check if user is a session participant
CREATE OR REPLACE FUNCTION public.is_session_participant_of_user(p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    -- Current user is a tutor who has a session with a student whose user_id = p_user_id
    SELECT 1 FROM public.sessions s
    JOIN public.tutor_profiles tp ON s.tutor_profile_id = tp.id
    JOIN public.student_profiles sp ON s.student_profile_id = sp.id
    WHERE tp.user_id = auth.uid() AND sp.user_id = p_user_id
    UNION ALL
    -- Current user is a student who has a session with a tutor whose user_id = p_user_id
    SELECT 1 FROM public.sessions s
    JOIN public.tutor_profiles tp ON s.tutor_profile_id = tp.id
    JOIN public.student_profiles sp ON s.student_profile_id = sp.id
    WHERE sp.user_id = auth.uid() AND tp.user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Tutors can read student profiles in their sessions
CREATE POLICY "Tutors can read session student profiles" ON public.student_profiles FOR SELECT
  USING (public.tutor_has_session_with_student(id));

-- 6. Session participants can read each other's basic user info
CREATE POLICY "Session participants can read user info" ON public.users FOR SELECT
  USING (public.is_session_participant_of_user(id));
