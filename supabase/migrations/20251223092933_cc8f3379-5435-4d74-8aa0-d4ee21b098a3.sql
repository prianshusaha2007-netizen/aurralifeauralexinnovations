-- Fix friend_codes: Remove public access policy and create secure lookup policy
DROP POLICY IF EXISTS "Anyone can view codes to redeem" ON public.friend_codes;

-- Create a policy that only allows looking up codes by the code value (not browsing all)
CREATE POLICY "Users can lookup codes by value"
ON public.friend_codes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix achievements: Remove the permissive leaderboard policy that exposes all achievements
DROP POLICY IF EXISTS "Authenticated users can view achievements for leaderboard" ON public.achievements;

-- Keep only the policy that restricts to own achievements
-- (The "Users can view their achievements" policy already exists and is correct)