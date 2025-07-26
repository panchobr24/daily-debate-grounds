-- Create mentions table
CREATE TABLE public.mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.debate_rooms(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Mentions policies
CREATE POLICY "Users can view mentions of themselves" 
ON public.mentions 
FOR SELECT 
USING (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can create mentions" 
ON public.mentions 
FOR INSERT 
WITH CHECK (auth.uid() = mentioned_by_id);

CREATE POLICY "Users can update their own mentions" 
ON public.mentions 
FOR UPDATE 
USING (auth.uid() = mentioned_user_id);

-- Create indexes for better performance
CREATE INDEX idx_mentions_mentioned_user_id ON public.mentions(mentioned_user_id);
CREATE INDEX idx_mentions_is_read ON public.mentions(is_read);
CREATE INDEX idx_mentions_room_id ON public.mentions(room_id); 