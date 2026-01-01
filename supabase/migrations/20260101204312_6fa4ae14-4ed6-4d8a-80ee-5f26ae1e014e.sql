-- Create focus_sessions table to persist focus data
CREATE TABLE public.focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  focus_type text NOT NULL,
  goal text,
  duration_minutes integer NOT NULL DEFAULT 25,
  completed text NOT NULL DEFAULT 'not_today', -- 'yes', 'almost', 'not_today'
  struggled_count integer DEFAULT 0,
  gym_sub_type text,
  gym_body_area text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own focus sessions"
ON public.focus_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own focus sessions"
ON public.focus_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own focus sessions"
ON public.focus_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Friends can view each other's sessions if both have public_profile = true
CREATE POLICY "Friends can view focus sessions of public friends"
ON public.focus_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    JOIN public.profiles p ON p.id = focus_sessions.user_id
    WHERE f.status = 'accepted'
    AND p.public_profile = true
    AND (
      (f.user_id = auth.uid() AND f.friend_id = focus_sessions.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = focus_sessions.user_id)
    )
  )
);

-- Add share_focus_stats field to profiles for granular opt-in
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS share_focus_stats boolean DEFAULT false;

-- Create index for faster friend queries
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at ON public.focus_sessions(created_at DESC);