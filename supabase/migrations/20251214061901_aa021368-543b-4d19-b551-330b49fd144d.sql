-- Create hydration_logs table for tracking water intake
CREATE TABLE public.hydration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hydration_settings table for user preferences
CREATE TABLE public.hydration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
  reminder_interval_minutes INTEGER NOT NULL DEFAULT 60,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for hydration_logs
CREATE POLICY "Users can view own hydration logs" ON public.hydration_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hydration logs" ON public.hydration_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own hydration logs" ON public.hydration_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for hydration_settings
CREATE POLICY "Users can view own hydration settings" ON public.hydration_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hydration settings" ON public.hydration_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hydration settings" ON public.hydration_settings FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_hydration_settings_updated_at
BEFORE UPDATE ON public.hydration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();