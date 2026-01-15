-- Create alarm types enum
CREATE TYPE alarm_type AS ENUM ('time_based', 'purpose', 'batch_task', 'follow_up', 'calendar_autopilot', 'reminder_chain');

-- Create execution mode enum
CREATE TYPE execution_mode AS ENUM ('ring_ask_execute', 'ring_execute', 'silent_execute', 'silent_execute_report', 'suppress', 'delay');

-- Create task category enum
CREATE TYPE task_category AS ENUM ('fitness', 'study', 'finance', 'social', 'reflection', 'routine', 'networking', 'outreach', 'wellness');

-- Create alarms table
CREATE TABLE public.alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  alarm_type alarm_type NOT NULL DEFAULT 'time_based',
  category task_category,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_pattern TEXT, -- 'daily', 'weekdays', 'weekends', 'weekly', 'monthly', custom cron
  is_active BOOLEAN DEFAULT true,
  execution_mode execution_mode DEFAULT 'ring_ask_execute',
  autonomy_level TEXT DEFAULT 'A', -- A, B, or C
  priority INTEGER DEFAULT 5, -- 1-10
  urgency INTEGER DEFAULT 5, -- 1-10
  actions JSONB DEFAULT '[]'::jsonb, -- array of action objects
  conditions JSONB DEFAULT '{}'::jsonb, -- context conditions for adaptive behavior
  metadata JSONB DEFAULT '{}'::jsonb,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  next_trigger_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alarm executions log
CREATE TABLE public.alarm_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarm_id UUID REFERENCES public.alarms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  execution_mode execution_mode NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, executing, completed, failed, skipped, delayed
  actions_performed JSONB DEFAULT '[]'::jsonb,
  context_snapshot JSONB DEFAULT '{}'::jsonb, -- mood, energy, time, etc at execution
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch tasks table for message batches
CREATE TABLE public.batch_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alarm_id UUID REFERENCES public.alarms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'message_batch', 'email_batch', 'follow_up_batch'
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of contact objects
  message_template TEXT,
  platform TEXT, -- 'whatsapp', 'sms', 'linkedin', 'instagram', 'email'
  status TEXT DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress JSONB DEFAULT '{"sent": 0, "total": 0, "failed": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow-up tracking
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_identifier TEXT, -- phone, email, etc
  platform TEXT NOT NULL,
  context TEXT,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  follow_up_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, contacted, responded, completed, abandoned
  response_received BOOLEAN DEFAULT false,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user context state (for adaptive behavior)
CREATE TABLE public.user_context_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_mood TEXT,
  current_energy TEXT,
  motivation_level INTEGER, -- 1-10
  burnout_score INTEGER, -- 1-10
  stress_level INTEGER, -- 1-10
  sleep_quality TEXT,
  last_sleep_at TIMESTAMP WITH TIME ZONE,
  last_wake_at TIMESTAMP WITH TIME ZONE,
  current_location TEXT,
  is_working BOOLEAN DEFAULT false,
  is_studying BOOLEAN DEFAULT false,
  is_exercising BOOLEAN DEFAULT false,
  active_focus_session BOOLEAN DEFAULT false,
  quiet_hours_active BOOLEAN DEFAULT false,
  context_metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarm_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for alarms
CREATE POLICY "Users can view their own alarms" ON public.alarms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own alarms" ON public.alarms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alarms" ON public.alarms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alarms" ON public.alarms FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for alarm_executions
CREATE POLICY "Users can view their own executions" ON public.alarm_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own executions" ON public.alarm_executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own executions" ON public.alarm_executions FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for batch_tasks
CREATE POLICY "Users can view their own batch tasks" ON public.batch_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own batch tasks" ON public.batch_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own batch tasks" ON public.batch_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own batch tasks" ON public.batch_tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for follow_ups
CREATE POLICY "Users can view their own follow ups" ON public.follow_ups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own follow ups" ON public.follow_ups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own follow ups" ON public.follow_ups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own follow ups" ON public.follow_ups FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_context_state
CREATE POLICY "Users can view their own context" ON public.user_context_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own context" ON public.user_context_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own context" ON public.user_context_state FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_alarms_updated_at BEFORE UPDATE ON public.alarms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batch_tasks_updated_at BEFORE UPDATE ON public.batch_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();