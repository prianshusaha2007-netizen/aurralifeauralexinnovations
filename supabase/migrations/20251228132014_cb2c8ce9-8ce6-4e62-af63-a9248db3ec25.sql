-- Remove the overly permissive public leaderboard policy
-- Since no leaderboard is implemented, follow principle of least privilege
DROP POLICY IF EXISTS "Anyone can view achievements for leaderboard" ON achievements;