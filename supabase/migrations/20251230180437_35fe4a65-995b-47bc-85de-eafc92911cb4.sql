-- Fix 1: Change generate_friend_code to SECURITY INVOKER (no elevated privileges needed)
CREATE OR REPLACE FUNCTION public.generate_friend_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$;

-- Fix 2: Remove overly permissive achievements policy and replace with user-controlled visibility
-- First, add public_profile column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT false;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view achievements for leaderboard" ON public.achievements;

-- Create a new policy that respects user privacy consent
CREATE POLICY "Users can view own achievements or public profiles" 
ON public.achievements FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = achievements.user_id 
    AND profiles.public_profile = true
  )
);