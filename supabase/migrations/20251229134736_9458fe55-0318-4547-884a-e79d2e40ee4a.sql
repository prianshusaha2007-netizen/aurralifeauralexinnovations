-- Create daily_focus_blocks table
CREATE TABLE public.daily_focus_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_focus_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own focus blocks"
ON public.daily_focus_blocks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus blocks"
ON public.daily_focus_blocks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus blocks"
ON public.daily_focus_blocks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus blocks"
ON public.daily_focus_blocks
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_daily_focus_blocks_updated_at
BEFORE UPDATE ON public.daily_focus_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();