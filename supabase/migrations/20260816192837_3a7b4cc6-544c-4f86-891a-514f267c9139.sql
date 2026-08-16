ALTER TABLE public.courses ALTER COLUMN slug SET DEFAULT '';

CREATE OR REPLACE FUNCTION public.courses_autoslug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base := regexp_replace(lower(coalesce(NEW.title,'course')), '[^a-z0-9]+', '-', 'g');
    base := btrim(base, '-');
    IF base = '' THEN base := 'course'; END IF;
    NEW.slug := base || '-' || substr(replace(gen_random_uuid()::text,'-',''), 1, 6);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER courses_autoslug_ins BEFORE INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.courses_autoslug();
CREATE TRIGGER courses_autoslug_upd BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.courses_autoslug();