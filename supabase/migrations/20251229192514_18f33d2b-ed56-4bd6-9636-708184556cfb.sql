-- Create table for voice conversation transcripts
CREATE TABLE public.voice_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own voice transcripts"
ON public.voice_transcripts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice transcripts"
ON public.voice_transcripts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice transcripts"
ON public.voice_transcripts
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_voice_transcripts_user_conversation 
ON public.voice_transcripts(user_id, conversation_id, created_at DESC);