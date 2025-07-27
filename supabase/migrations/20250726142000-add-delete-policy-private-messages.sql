-- Add DELETE policy for private_messages
CREATE POLICY "Users can delete messages they received" 
ON public.private_messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.private_chat_rooms 
    WHERE id = room_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
  AND sender_id != auth.uid() -- Only allow deleting messages they received (not sent)
);

-- Add DELETE policy for messages that mention the user
CREATE POLICY "Users can delete messages that mention them" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND content ILIKE '%@' || username || '%'
  )
); 