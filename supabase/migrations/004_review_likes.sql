-- ============================================
-- REVIEW LIKES (Helpful feature)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add helpful_count to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;

-- Junction table: which user liked which review
CREATE TABLE IF NOT EXISTS public.review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see likes (for count purposes)
CREATE POLICY "Anyone can view review likes" ON public.review_likes FOR SELECT USING (true);

-- Authenticated users can like/unlike
CREATE POLICY "Authenticated users can like reviews" ON public.review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.review_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update helpful_count on reviews when likes change
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = (
    SELECT COUNT(*) FROM public.review_likes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_like_change
  AFTER INSERT OR DELETE ON public.review_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();
