-- Fix: Change generate_referral_code() from SECURITY DEFINER to SECURITY INVOKER
-- This function only generates random codes and doesn't require elevated privileges

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'AURRA' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;