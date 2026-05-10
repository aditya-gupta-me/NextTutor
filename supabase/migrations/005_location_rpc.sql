-- ============================================
-- NEARBY TUTORS RPC (PostGIS distance search)
-- Run this in Supabase SQL Editor
-- ============================================

-- Helper: extract lat/lng from a geography column
-- Returns tutors within a given distance, sorted by proximity

CREATE OR REPLACE FUNCTION public.nearby_tutors(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  subjects JSONB,
  qualification TEXT,
  fee_per_month INTEGER,
  fee_per_session INTEGER,
  locality TEXT,
  city TEXT,
  verification_status TEXT,
  avg_rating NUMERIC,
  review_count INTEGER,
  available_seats INTEGER,
  service_radius_km NUMERIC,
  full_name TEXT,
  avatar_url TEXT,
  distance_km DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.id,
    tp.slug,
    tp.subjects::JSONB,
    tp.qualification,
    tp.fee_per_month,
    tp.fee_per_session,
    tp.locality,
    tp.city,
    tp.verification_status::TEXT,
    tp.avg_rating,
    tp.review_count,
    tp.available_seats,
    tp.service_radius_km,
    u.full_name,
    u.avatar_url,
    ROUND(
      ST_Distance(
        tp.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0,
      1
    ) AS distance_km,
    ST_Y(tp.location::geometry) AS latitude,
    ST_X(tp.location::geometry) AS longitude
  FROM public.tutor_profiles tp
  INNER JOIN public.users u ON u.id = tp.user_id
  WHERE tp.location IS NOT NULL
    AND ST_DWithin(
      tp.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000  -- ST_DWithin uses metres
    )
  ORDER BY distance_km ASC;
END;
$$;

-- Helper: extract lat/lng from a single tutor's location
CREATE OR REPLACE FUNCTION public.get_tutor_coords(tutor_id UUID)
RETURNS TABLE (lat DOUBLE PRECISION, lng DOUBLE PRECISION)
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ST_Y(tp.location::geometry) AS lat,
    ST_X(tp.location::geometry) AS lng
  FROM public.tutor_profiles tp
  WHERE tp.id = tutor_id
    AND tp.location IS NOT NULL;
END;
$$;
