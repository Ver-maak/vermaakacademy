
-- Pin & rich course details
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_description text,
  ADD COLUMN IF NOT EXISTS prerequisites text,
  ADD COLUMN IF NOT EXISTS certificate text,
  ADD COLUMN IF NOT EXISTS price text,
  ADD COLUMN IF NOT EXISTS what_you_learn jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_courses_pinned ON public.courses (pinned DESC, pinned_at DESC NULLS LAST, created_at DESC);

-- Richer enrollment fields
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS age_range text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender text DEFAULT '',
  ADD COLUMN IF NOT EXISTS occupation text DEFAULT '',
  ADD COLUMN IF NOT EXISTS education_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_schedule text DEFAULT '',
  ADD COLUMN IF NOT EXISTS heard_from text DEFAULT '';

-- Richer partner inquiry fields
ALTER TABLE public.partner_inquiries
  ADD COLUMN IF NOT EXISTS role text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS organization_size text DEFAULT '',
  ADD COLUMN IF NOT EXISTS industry text DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget_range text DEFAULT '',
  ADD COLUMN IF NOT EXISTS timeline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS goals text DEFAULT '';
