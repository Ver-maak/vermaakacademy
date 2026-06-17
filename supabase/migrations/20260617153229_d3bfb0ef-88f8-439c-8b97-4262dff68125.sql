
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 0;

CREATE TABLE public.credit_balances (
  email text PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_balances_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT credit_balances_non_negative CHECK (balance >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;

ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read balances" ON public.credit_balances FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert balances" ON public.credit_balances FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update balances" ON public.credit_balances FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete balances" ON public.credit_balances FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER credit_balances_updated_at
  BEFORE UPDATE ON public.credit_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('grant','deduct','spend','refund')),
  reason text NOT NULL DEFAULT '',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_email ON public.credit_transactions(email, created_at DESC);

GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read transactions" ON public.credit_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  _email text,
  _amount integer,
  _reason text DEFAULT ''
)
RETURNS TABLE(email text, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(_email));
  v_balance integer;
  v_type text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _amount = 0 THEN
    RAISE EXCEPTION 'Amount cannot be zero';
  END IF;
  IF v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  INSERT INTO public.credit_balances (email, balance)
  VALUES (v_email, GREATEST(0, _amount))
  ON CONFLICT (email) DO UPDATE
    SET balance = GREATEST(0, public.credit_balances.balance + _amount)
  RETURNING public.credit_balances.balance INTO v_balance;

  v_type := CASE WHEN _amount > 0 THEN 'grant' ELSE 'deduct' END;

  INSERT INTO public.credit_transactions (email, amount, type, reason, created_by)
  VALUES (v_email, _amount, v_type, COALESCE(_reason, ''), auth.uid());

  RETURN QUERY SELECT v_email, v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_credits_for_enrollment(
  _email text,
  _course_id uuid
)
RETURNS TABLE(success boolean, balance integer, cost integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(_email));
  v_cost integer;
  v_title text;
  v_balance integer;
BEGIN
  SELECT credit_cost, title INTO v_cost, v_title
  FROM public.courses WHERE id = _course_id;

  IF v_cost IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'Course not found';
    RETURN;
  END IF;

  IF v_cost = 0 THEN
    RETURN QUERY SELECT true, COALESCE((SELECT balance FROM public.credit_balances WHERE email = v_email), 0), 0, 'Free course';
    RETURN;
  END IF;

  SELECT balance INTO v_balance FROM public.credit_balances WHERE email = v_email FOR UPDATE;
  v_balance := COALESCE(v_balance, 0);

  IF v_balance < v_cost THEN
    RETURN QUERY SELECT false, v_balance, v_cost, 'Insufficient credits';
    RETURN;
  END IF;

  UPDATE public.credit_balances
    SET balance = balance - v_cost
    WHERE email = v_email
    RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions (email, amount, type, reason, course_id, course_title)
  VALUES (v_email, -v_cost, 'spend', 'Enrollment', _course_id, v_title);

  RETURN QUERY SELECT true, v_balance, v_cost, 'OK';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits_for_enrollment(text, uuid) TO anon, authenticated;
