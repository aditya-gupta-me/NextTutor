-- ============================================
-- TSearch Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable PostGIS for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- PostGIS creates spatial_ref_sys in public — enable RLS to silence Supabase warning
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of spatial references"
  ON public.spatial_ref_sys FOR SELECT USING (true);

-- ============================================
-- USERS table (synced with auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('tutor', 'student')),
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user row when auth user signs up
-- Reads role and full_name from the signup metadata if available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TUTOR_PROFILES
-- ============================================
CREATE TABLE public.tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  qualification TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  age INTEGER,
  fee_per_month INTEGER,
  fee_per_session INTEGER,
  address TEXT NOT NULL DEFAULT '',
  locality TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  location GEOGRAPHY(POINT, 4326),
  service_radius_km INTEGER NOT NULL DEFAULT 5,
  available_seats INTEGER NOT NULL DEFAULT 10,
  schedule JSONB,
  govt_id_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  slug TEXT UNIQUE,
  avg_rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tutor_profiles_location ON public.tutor_profiles USING GIST (location);
CREATE INDEX idx_tutor_profiles_slug ON public.tutor_profiles (slug);
CREATE INDEX idx_tutor_profiles_city ON public.tutor_profiles (city);
CREATE INDEX idx_tutor_profiles_subjects ON public.tutor_profiles USING GIN (subjects);

-- ============================================
-- STUDENT_PROFILES
-- ============================================
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  school TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  age INTEGER,
  subjects_interested TEXT[] NOT NULL DEFAULT '{}',
  locality TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PARENT_INFO
-- ============================================
CREATE TABLE public.parent_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL UNIQUE REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL DEFAULT '',
  parent_phone TEXT NOT NULL DEFAULT '',
  parent_email TEXT,
  relationship TEXT NOT NULL DEFAULT 'guardian' CHECK (relationship IN ('father', 'mother', 'guardian'))
);

-- ============================================
-- TUTOR_FAQS
-- ============================================
CREATE TABLE public.tutor_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_tutor_faqs_profile ON public.tutor_faqs (tutor_profile_id, display_order);

-- ============================================
-- SESSIONS
-- ============================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'recurring' CHECK (type IN ('recurring', 'one_time')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined', 'active', 'completed', 'cancelled')),
  schedule JSONB,
  session_date TIMESTAMPTZ,
  subject TEXT NOT NULL,
  agreed_fee INTEGER NOT NULL DEFAULT 0,
  fee_type TEXT NOT NULL DEFAULT 'monthly' CHECK (fee_type IN ('monthly', 'per_session')),
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_tutor ON public.sessions (tutor_profile_id, status);
CREATE INDEX idx_sessions_student ON public.sessions (student_profile_id, status);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  tutor_profile_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_profile_id)
);

-- Auto-update tutor avg_rating and review_count
CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tutor_profiles
  SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE tutor_profile_id = COALESCE(NEW.tutor_profile_id, OLD.tutor_profile_id)),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE tutor_profile_id = COALESCE(NEW.tutor_profile_id, OLD.tutor_profile_id))
  WHERE id = COALESCE(NEW.tutor_profile_id, OLD.tutor_profile_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_tutor_rating();

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  tutor_profile_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'manual' CHECK (payment_method IN ('razorpay', 'manual')),
  razorpay_payment_id TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON public.payments (student_profile_id, status);
CREATE INDEX idx_payments_tutor ON public.payments (tutor_profile_id, status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users: read own, insert own, update own
-- Also allow reading tutor user rows (needed for search page join)
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Anyone can read tutor user rows" ON public.users FOR SELECT
  USING (role = 'tutor');
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Tutor profiles: public read, owner write
CREATE POLICY "Anyone can view tutor profiles" ON public.tutor_profiles FOR SELECT USING (true);
CREATE POLICY "Tutors can insert own profile" ON public.tutor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tutors can update own profile" ON public.tutor_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Student profiles: owner read/write
CREATE POLICY "Students can read own profile" ON public.student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update own profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);
-- Helper function to check if a tutor has a session with a student (bypasses RLS to avoid circular dependency)
CREATE OR REPLACE FUNCTION public.tutor_has_session_with_student(p_student_profile_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.tutor_profiles tp ON s.tutor_profile_id = tp.id
    WHERE s.student_profile_id = p_student_profile_id
    AND tp.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Tutors can read student profiles involved in their sessions (uses SECURITY DEFINER to avoid circular RLS)
CREATE POLICY "Tutors can read session student profiles" ON public.student_profiles FOR SELECT
  USING (public.tutor_has_session_with_student(id));

-- Helper function to check if a user is a session participant of another user
CREATE OR REPLACE FUNCTION public.is_session_participant_of_user(p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.tutor_profiles tp ON s.tutor_profile_id = tp.id
    JOIN public.student_profiles sp ON s.student_profile_id = sp.id
    WHERE (tp.user_id = auth.uid() AND sp.user_id = p_user_id)
       OR (sp.user_id = auth.uid() AND tp.user_id = p_user_id)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Session participants can read each other's basic user info
CREATE POLICY "Session participants can read user info" ON public.users FOR SELECT
  USING (public.is_session_participant_of_user(id));

-- Parent info: student owner read/write
CREATE POLICY "Students can manage parent info" ON public.parent_info FOR ALL
  USING (student_profile_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- Tutor FAQs: public read, tutor write
CREATE POLICY "Anyone can view tutor FAQs" ON public.tutor_faqs FOR SELECT USING (true);
CREATE POLICY "Tutors can manage own FAQs" ON public.tutor_faqs FOR ALL
  USING (tutor_profile_id IN (SELECT id FROM public.tutor_profiles WHERE user_id = auth.uid()));

-- Sessions: participants can read, students can create, tutors can update status
CREATE POLICY "Session participants can view" ON public.sessions FOR SELECT
  USING (
    tutor_profile_id IN (SELECT id FROM public.tutor_profiles WHERE user_id = auth.uid())
    OR student_profile_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Students can create sessions" ON public.sessions FOR INSERT
  WITH CHECK (student_profile_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Participants can update sessions" ON public.sessions FOR UPDATE
  USING (
    tutor_profile_id IN (SELECT id FROM public.tutor_profiles WHERE user_id = auth.uid())
    OR student_profile_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
  );

-- Reviews: public read, students with confirmed sessions can write
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Students can create reviews" ON public.reviews FOR INSERT
  WITH CHECK (student_profile_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- Payments: participants can view
CREATE POLICY "Payment participants can view" ON public.payments FOR SELECT
  USING (
    tutor_profile_id IN (SELECT id FROM public.tutor_profiles WHERE user_id = auth.uid())
    OR student_profile_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
  );
