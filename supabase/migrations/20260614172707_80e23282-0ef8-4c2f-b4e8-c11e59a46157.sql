ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS registration_start timestamptz,
  ADD COLUMN IF NOT EXISTS registration_end timestamptz;