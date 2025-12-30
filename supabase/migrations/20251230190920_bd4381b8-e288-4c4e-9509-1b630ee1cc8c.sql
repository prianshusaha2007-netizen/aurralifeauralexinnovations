-- Create user_credits table for tracking daily usage and subscription status
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_since TIMESTAMP WITH TIME ZONE,
  daily_credits_used INTEGER NOT NULL DEFAULT 0,
  daily_credits_limit INTEGER NOT NULL DEFAULT 50,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();