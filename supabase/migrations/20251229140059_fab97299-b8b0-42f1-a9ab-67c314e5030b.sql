-- Create a table for weekly reflections
CREATE TABLE public.weekly_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  focus_blocks_completed INTEGER DEFAULT 0,
  overall_feeling TEXT,
  highlights TEXT,
  challenges TEXT,
  gratitude TEXT,
  next_week_intention TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own reflections" 
ON public.weekly_reflections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections" 
ON public.weekly_reflections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections" 
ON public.weekly_reflections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections" 
ON public.weekly_reflections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_weekly_reflections_user_week ON public.weekly_reflections(user_id, week_start);