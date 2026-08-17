CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.site_settings (key, value) VALUES ('general', jsonb_build_object(
  'site_name','Vermaak Academy',
  'tagline','Digital skills, creativity and innovation for African talent',
  'contact_email','vermaakinc1@gmail.com',
  'contact_phone','',
  'cities','Kampala · Nairobi',
  'base_students',500,
  'base_partners',3,
  'countries',2,
  'currency','UGX',
  'enrolment_open',true,
  'facebook','','instagram','','linkedin','','x','' ));

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_email TEXT, _role app_role)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No account found for %', _email; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role) ON CONFLICT (user_id, role) DO NOTHING;
  RETURN 'ok';
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_user_role(_email TEXT, _role app_role)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No account found for %', _email; END IF;
  DELETE FROM public.user_roles WHERE user_id = _uid AND role = _role;
  RETURN 'ok';
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_staff()
RETURNS TABLE(user_id uuid, email text, role app_role) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  RETURN QUERY SELECT ur.user_id, u.email::text, ur.role FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id ORDER BY u.email;
END; $$;