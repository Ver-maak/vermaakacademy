-- Partner inquiries
CREATE TABLE public.partner_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  partnership_type text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_inquiries TO authenticated;
GRANT INSERT ON public.partner_inquiries TO anon;
GRANT ALL ON public.partner_inquiries TO service_role;
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner inquiry"
ON public.partner_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 120 AND
  char_length(email) BETWEEN 3 AND 255 AND
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
  char_length(organization) <= 200 AND
  char_length(phone) <= 40 AND
  char_length(partnership_type) <= 80 AND
  char_length(message) <= 2000
);
CREATE POLICY "Admins read partner inquiries"
ON public.partner_inquiries FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update partner inquiries"
ON public.partner_inquiries FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete partner inquiries"
ON public.partner_inquiries FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title text NOT NULL DEFAULT '',
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  motivation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT INSERT ON public.course_enrollments TO anon;
GRANT ALL ON public.course_enrollments TO service_role;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit enrollment"
ON public.course_enrollments FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 120 AND
  char_length(email) BETWEEN 3 AND 255 AND
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
  char_length(phone) <= 40 AND
  char_length(motivation) <= 2000 AND
  char_length(course_title) <= 200
);
CREATE POLICY "Admins read enrollments"
ON public.course_enrollments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update enrollments"
ON public.course_enrollments FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete enrollments"
ON public.course_enrollments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));