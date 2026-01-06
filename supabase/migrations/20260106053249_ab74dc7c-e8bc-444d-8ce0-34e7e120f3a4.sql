-- Create mentorship_profiles table
CREATE TABLE public.mentorship_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role selection (multi-select)
  role_types TEXT[] DEFAULT '{}',  -- student, parent, trainer, learner
  
  -- Mentorship style
  mentorship_style TEXT DEFAULT 'mentor',  -- teacher, mentor, coach, calm_companion
  
  -- Subject/Practice setup
  subjects TEXT[] DEFAULT '{}',  -- study subjects or skill areas
  practices TEXT[] DEFAULT '{}',  -- gym, yoga, martial_arts, coding, design, music
  level TEXT DEFAULT 'beginner',  -- beginner, intermediate, advanced
  injuries_notes TEXT,  -- optional injury notes for fitness
  
  -- Quiet hours / Do not disturb
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  quiet_during_work BOOLEAN DEFAULT false,
  only_if_user_messages_first BOOLEAN DEFAULT false,
  
  -- Follow-up settings
  follow_up_enabled BOOLEAN DEFAULT true,
  last_checkin_time TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_mentorship UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.mentorship_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mentorship profile" 
ON public.mentorship_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mentorship profile" 
ON public.mentorship_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentorship profile" 
ON public.mentorship_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mentorship profile" 
ON public.mentorship_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mentorship_profiles_updated_at
BEFORE UPDATE ON public.mentorship_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();