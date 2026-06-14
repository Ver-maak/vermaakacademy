ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_key
  ON public.newsletter_subscribers(unsubscribe_token);

CREATE OR REPLACE FUNCTION public.get_subscriber_by_token(_token uuid)
RETURNS TABLE(email text, already_unsubscribed boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email, unsubscribed_at IS NOT NULL
  FROM public.newsletter_subscribers
  WHERE unsubscribe_token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(_token uuid)
RETURNS TABLE(email text, success boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  UPDATE public.newsletter_subscribers
  SET unsubscribed_at = COALESCE(unsubscribed_at, now())
  WHERE unsubscribe_token = _token
  RETURNING newsletter_subscribers.email INTO v_email;

  IF v_email IS NULL THEN
    RETURN QUERY SELECT NULL::text, false;
  ELSE
    RETURN QUERY SELECT v_email, true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_subscriber_by_token(uuid) FROM public;
REVOKE ALL ON FUNCTION public.unsubscribe_newsletter(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_subscriber_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(uuid) TO anon, authenticated;