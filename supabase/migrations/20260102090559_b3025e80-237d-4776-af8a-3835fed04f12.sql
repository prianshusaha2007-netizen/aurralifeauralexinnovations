-- Create community challenges table
CREATE TABLE public.community_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'focus_days',
  target_value INTEGER NOT NULL DEFAULT 7,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user challenge participation table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_progress_date DATE,
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Challenges are readable by all authenticated users
CREATE POLICY "Anyone can view active challenges"
ON public.community_challenges
FOR SELECT
USING (is_active = true);

-- Participants policies
CREATE POLICY "Users can view their own participation"
ON public.challenge_participants
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.challenge_participants
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_challenges_active ON public.community_challenges(is_active, end_date);
CREATE INDEX idx_participants_user ON public.challenge_participants(user_id);
CREATE INDEX idx_participants_challenge ON public.challenge_participants(challenge_id);

-- Insert some initial challenges
INSERT INTO public.community_challenges (title, description, challenge_type, target_value, start_date, end_date)
VALUES 
  ('7 Days of Showing Up', 'Complete at least one focus session every day for 7 days. Small steps, big impact.', 'focus_days', 7, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
  ('3 Focus Sessions This Week', 'Complete 3 focus sessions this week. Quality over quantity.', 'focus_sessions', 3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
  ('Morning Momentum', 'Start 5 focus sessions before noon. Build that morning routine.', 'morning_sessions', 5, CURRENT_DATE, INTERVAL '14 days' + CURRENT_DATE);