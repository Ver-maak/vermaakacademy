CREATE TABLE public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  learner_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

GRANT SELECT ON public.course_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_reviews TO authenticated;
GRANT ALL ON public.course_reviews TO service_role;

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are public" ON public.course_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Own reviews read" ON public.course_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff read all reviews" ON public.course_reviews
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Enrolled learners write own review" ON public.course_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.enrolments e
      WHERE e.user_id = auth.uid() AND e.course_id = course_reviews.course_id
        AND e.status IN ('active','completed')
    )
  );

CREATE POLICY "Own review update" ON public.course_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own review delete" ON public.course_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff manage reviews" ON public.course_reviews
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER course_reviews_updated_at BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_course_ratings()
RETURNS TABLE(course_id uuid, avg_rating numeric, review_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.course_id, round(avg(r.rating)::numeric, 2), count(*)
  FROM public.course_reviews r
  WHERE r.status = 'approved'
  GROUP BY r.course_id
$$;