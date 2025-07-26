-- Create friend requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

-- Create friendships table (mutual friends)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Create private chat rooms table
CREATE TABLE public.private_chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Create private messages table
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.private_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
CREATE POLICY "Users can view friend requests involving them" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests they received" 
ON public.friend_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Private chat rooms policies
CREATE POLICY "Users can view their private chat rooms" 
ON public.private_chat_rooms 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create private chat rooms" 
ON public.private_chat_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Private messages policies
CREATE POLICY "Users can view messages in their rooms" 
ON public.private_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.private_chat_rooms 
    WHERE id = room_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

CREATE POLICY "Users can create messages in their rooms" 
ON public.private_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.private_chat_rooms 
    WHERE id = room_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_private_chat_rooms_updated_at
BEFORE UPDATE ON public.private_chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_private_messages_updated_at
BEFORE UPDATE ON public.private_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for private messages
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
ALTER TABLE private_messages REPLICA IDENTITY FULL;

-- Create function to handle accepting friend requests
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req_record RECORD;
BEGIN
  -- Get the friend request details
  SELECT * INTO req_record 
  FROM public.friend_requests 
  WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;
  
  -- Update request status
  UPDATE public.friend_requests 
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;
  
  -- Create friendship (ensuring smaller UUID is always user1_id for consistency)
  INSERT INTO public.friendships (user1_id, user2_id)
  VALUES (
    LEAST(req_record.requester_id, req_record.receiver_id),
    GREATEST(req_record.requester_id, req_record.receiver_id)
  );
  
  -- Create private chat room
  INSERT INTO public.private_chat_rooms (user1_id, user2_id)
  VALUES (
    LEAST(req_record.requester_id, req_record.receiver_id),
    GREATEST(req_record.requester_id, req_record.receiver_id)
  );
END;
$$;