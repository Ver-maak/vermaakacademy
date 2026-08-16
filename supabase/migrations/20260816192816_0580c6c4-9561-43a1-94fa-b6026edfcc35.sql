-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('admin','super_admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_instructor(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('instructor','admin','super_admin'))
$$;

CREATE TYPE public.course_type AS ENUM ('self_paced','cohort','live','free');
CREATE TYPE public.application_status AS ENUM ('pending_payment','submitted','enrolled','cancelled','rejected');
CREATE TYPE public.order_status AS ENUM ('pending','paid','failed','cancelled','refunded','disputed');
CREATE TYPE public.enrolment_status AS ENUM ('active','suspended','completed','revoked');
CREATE TYPE public.enrolment_source AS ENUM ('payment','complimentary','sponsored','credits','free');
CREATE TYPE public.certificate_status AS ENUM ('valid','revoked','reissued');
CREATE TYPE public.lesson_kind AS ENUM ('video','text','audio','embed');

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  organisation text NOT NULL DEFAULT '',
  occupation text NOT NULL DEFAULT '',
  heard_from text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid())) WITH CHECK (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ categories / instructors ============
CREATE TABLE public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_categories TO authenticated;
GRANT ALL ON public.course_categories TO service_role;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.course_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage categories" ON public.course_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instructors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instructors TO authenticated;
GRANT ALL ON public.instructors TO service_role;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instructors public read" ON public.instructors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage instructors" ON public.instructors FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ courses extension ============
ALTER TABLE public.courses
  ADD COLUMN course_type public.course_type NOT NULL DEFAULT 'cohort',
  ADD COLUMN slug text,
  ADD COLUMN price_ugx integer NOT NULL DEFAULT 0,
  ADD COLUMN discount_price_ugx integer,
  ADD COLUMN currency text NOT NULL DEFAULT 'UGX',
  ADD COLUMN category_id uuid REFERENCES public.course_categories(id) ON DELETE SET NULL,
  ADD COLUMN instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  ADD COLUMN target_audience text,
  ADD COLUMN estimated_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN reviews_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN completion_rules jsonb NOT NULL DEFAULT '{"require_all_lessons":true,"require_mandatory_quizzes":true,"min_final_score":0,"require_feedback":false}'::jsonb,
  ADD COLUMN archived_at timestamptz;

UPDATE public.courses SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') || '-' || substr(id::text, 1, 6) WHERE slug IS NULL;
ALTER TABLE public.courses ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX courses_slug_key ON public.courses (slug);
CREATE INDEX courses_type_idx ON public.courses (course_type) WHERE published;

-- ============ modules / lessons / resources ============
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_modules_course_idx ON public.course_modules (course_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER course_modules_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind public.lesson_kind NOT NULL DEFAULT 'text',
  body text NOT NULL DEFAULT '',
  media_path text,
  media_url text,
  transcript text,
  duration_minutes integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  prerequisite_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_module_idx ON public.lessons (module_id, position);
CREATE INDEX lessons_course_idx ON public.lessons (course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lesson_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text,
  url text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_resources_lesson_idx ON public.lesson_resources (lesson_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_resources TO authenticated;
GRANT ALL ON public.lesson_resources TO service_role;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

-- ============ enrolments ============
CREATE TABLE public.enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_id uuid,
  status public.enrolment_status NOT NULL DEFAULT 'active',
  source public.enrolment_source NOT NULL DEFAULT 'payment',
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  grant_reason text NOT NULL DEFAULT '',
  needs_review boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX enrolments_one_active ON public.enrolments (user_id, course_id) WHERE status IN ('active','suspended','completed');
CREATE INDEX enrolments_course_idx ON public.enrolments (course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrolments TO authenticated;
GRANT ALL ON public.enrolments TO service_role;
ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own enrolments read" ON public.enrolments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage enrolments" ON public.enrolments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER enrolments_updated_at BEFORE UPDATE ON public.enrolments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_course_access(_uid uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrolments
    WHERE user_id = _uid AND course_id = _course_id AND status IN ('active','completed')
  ) OR public.is_staff(_uid)
$$;

CREATE POLICY "Modules for enrolled or staff" ON public.course_modules FOR SELECT TO authenticated USING (public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Staff manage modules" ON public.course_modules FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Lessons for enrolled or staff" ON public.lessons FOR SELECT TO authenticated USING (public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Staff manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Resources for enrolled or staff" ON public.lesson_resources FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND public.has_course_access(auth.uid(), l.course_id))
);
CREATE POLICY "Staff manage resources" ON public.lesson_resources FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_course_curriculum(_course_id uuid)
RETURNS TABLE(module_id uuid, module_title text, module_position integer, lesson_id uuid, lesson_title text, lesson_position integer, lesson_kind public.lesson_kind, duration_minutes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.position, l.id, l.title, l.position, l.kind, l.duration_minutes
  FROM public.course_modules m
  JOIN public.courses c ON c.id = m.course_id AND c.published AND c.archived_at IS NULL
  LEFT JOIN public.lessons l ON l.module_id = m.id AND l.archived_at IS NULL
  WHERE m.course_id = _course_id AND m.archived_at IS NULL
  ORDER BY m.position, l.position
$$;

-- ============ applications / discounts / orders / payments ============
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'pending_payment',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  organisation text NOT NULL DEFAULT '',
  occupation text NOT NULL DEFAULT '',
  motivation text NOT NULL DEFAULT '',
  heard_from text NOT NULL DEFAULT '',
  agreed_terms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX applications_one_open ON public.applications (user_id, course_id) WHERE status IN ('pending_payment','submitted','enrolled');
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own applications read" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Own applications insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND agreed_terms = true AND char_length(full_name) BETWEEN 1 AND 120 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
CREATE POLICY "Staff manage applications" ON public.applications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'percent',
  value integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  per_user_limit integer NOT NULL DEFAULT 1,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage discounts" ON public.discount_codes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  tx_ref text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'UGX',
  discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  discount_amount integer NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders (user_id, created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.enrolments ADD CONSTRAINT enrolments_order_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'flutterwave',
  provider_tx_id text,
  tx_ref text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'UGX',
  status public.order_status NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT '',
  verified_at timestamptz,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payments_provider_tx_key ON public.payments (provider, provider_tx_id) WHERE provider_tx_id IS NOT NULL;
CREATE INDEX payments_order_idx ON public.payments (order_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own payments read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage payments" ON public.payments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discount_redemptions TO authenticated;
GRANT ALL ON public.discount_redemptions TO service_role;
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own redemptions read" ON public.discount_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage redemptions" ON public.discount_redemptions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ progress ============
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at timestamptz,
  seconds_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX lesson_progress_key ON public.lesson_progress (user_id, lesson_id);
CREATE INDEX lesson_progress_course_idx ON public.lesson_progress (user_id, course_id);
GRANT SELECT, INSERT, UPDATE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own lesson progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Own lesson progress write" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Own lesson progress update" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.course_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  percent integer NOT NULL DEFAULT 0,
  last_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE ON public.course_progress TO authenticated;
GRANT ALL ON public.course_progress TO service_role;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own course progress" ON public.course_progress FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Own course progress write" ON public.course_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own course progress update" ON public.course_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER course_progress_updated_at BEFORE UPDATE ON public.course_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ quizzes ============
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  pass_mark integer NOT NULL DEFAULT 70,
  max_attempts integer NOT NULL DEFAULT 3,
  is_mandatory boolean NOT NULL DEFAULT true,
  score_mode text NOT NULL DEFAULT 'best',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes for enrolled or staff" ON public.quizzes FOR SELECT TO authenticated USING (public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Staff manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  kind text NOT NULL DEFAULT 'single',
  explanation text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 1,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_questions_quiz_idx ON public.quiz_questions (quiz_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX quiz_answers_question_idx ON public.quiz_answers (question_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage answers" ON public.quiz_answers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL DEFAULT 1,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts (user_id, quiz_id);
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts read" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ certificates ============
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  learner_name text NOT NULL,
  course_title text NOT NULL,
  final_score integer NOT NULL DEFAULT 0,
  signatory text NOT NULL DEFAULT 'Vermaak Academy',
  status public.certificate_status NOT NULL DEFAULT 'valid',
  revoked_reason text NOT NULL DEFAULT '',
  issued_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX certificates_user_idx ON public.certificates (user_id);
GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own certificates read" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.verify_certificate(_number text)
RETURNS TABLE(certificate_number text, learner_name text, course_title text, issued_at timestamptz, status public.certificate_status)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_number, c.learner_name, c.course_title, c.issued_at, c.status
  FROM public.certificates c
  WHERE upper(c.certificate_number) = upper(trim(_number))
  LIMIT 1
$$;

-- ============ reviews / notifications / audit ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  learner_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reviews_one_per_course ON public.reviews (user_id, course_id);
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews public" ON public.reviews FOR SELECT TO anon, authenticated USING (approved = true OR auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Enrolled can review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_course_access(auth.uid(), course_id) AND char_length(body) <= 2000);
CREATE POLICY "Staff manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  email_to text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============ storage object policies (buckets created via storage tool) ============
CREATE POLICY "Lesson media readable by enrolled" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('lesson-media','lesson-resources')
  AND (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.enrolments e
      WHERE e.user_id = auth.uid()
        AND e.status IN ('active','completed')
        AND e.course_id::text = (storage.foldername(name))[1]
    )
  )
);
CREATE POLICY "Staff upload lesson media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('lesson-media','lesson-resources') AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update lesson media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('lesson-media','lesson-resources') AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id IN ('lesson-media','lesson-resources') AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete lesson media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('lesson-media','lesson-resources') AND public.is_staff(auth.uid()));