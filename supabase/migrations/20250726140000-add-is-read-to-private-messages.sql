-- Add is_read column to private_messages table
ALTER TABLE public.private_messages 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance when querying unread messages
CREATE INDEX idx_private_messages_is_read ON public.private_messages(is_read); 