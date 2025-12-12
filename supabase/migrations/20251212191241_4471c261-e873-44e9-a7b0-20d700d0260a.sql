-- Add professions array and goals to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stress_level text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS preferred_model text DEFAULT 'gemini-flash';

-- Create mood_checkins table for tracking daily moods
CREATE TABLE IF NOT EXISTS public.mood_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood text NOT NULL,
  energy text NOT NULL,
  stress text NOT NULL,
  notes text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mood_checkins
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mood_checkins
CREATE POLICY "Users can view own mood checkins" 
ON public.mood_checkins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood checkins" 
ON public.mood_checkins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood checkins" 
ON public.mood_checkins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create memories table for storing user memories
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for memories
CREATE POLICY "Users can view own memories" 
ON public.memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" 
ON public.memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" 
ON public.memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create routines table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title text NOT NULL,
  time text NOT NULL,
  type text NOT NULL,
  completed boolean DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for routines
CREATE POLICY "Users can view own routines" 
ON public.routines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines" 
ON public.routines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines" 
ON public.routines 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines" 
ON public.routines 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text text NOT NULL,
  time text NOT NULL,
  active boolean DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reminders
CREATE POLICY "Users can view own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add update policy for chat_messages
CREATE POLICY "Users can update own messages" 
ON public.chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id);