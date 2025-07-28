-- Force cleanup of orphaned data to allow email reuse
-- This migration addresses the persistent issue where deleted accounts prevent email reuse

-- Step 1: Clean up all orphaned profiles (profiles without corresponding auth.users)
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2: Clean up orphaned messages
DELETE FROM public.messages 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 3: Clean up orphaned reactions
DELETE FROM public.message_reactions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 4: Clean up orphaned mentions
DELETE FROM public.mentions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 5: Clean up orphaned notifications
DELETE FROM public.notifications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 6: Create a more aggressive cleanup function
CREATE OR REPLACE FUNCTION public.force_cleanup_deleted_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  -- Clean up orphaned profiles
  DELETE FROM public.profiles 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up orphaned messages
  DELETE FROM public.messages 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up orphaned reactions
  DELETE FROM public.message_reactions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up orphaned mentions
  DELETE FROM public.mentions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up orphaned notifications
  DELETE FROM public.notifications 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  RETURN total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a function to check if email can be reused
CREATE OR REPLACE FUNCTION public.can_reuse_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there's an active user with this email
  -- This includes checking for soft-deleted users
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = email_address 
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create a function to manually delete user data
CREATE OR REPLACE FUNCTION public.manual_delete_user(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Delete all user data
  DELETE FROM public.profiles WHERE user_id = user_id;
  DELETE FROM public.messages WHERE user_id = user_id;
  DELETE FROM public.message_reactions WHERE user_id = user_id;
  DELETE FROM public.mentions WHERE user_id = user_id;
  DELETE FROM public.notifications WHERE user_id = user_id;
  
  -- Delete the user from auth (this will be done by Supabase admin)
  -- We can't do this directly, but we can clean up the data
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON public.mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Step 10: Add comments to document the functions
COMMENT ON FUNCTION public.force_cleanup_deleted_users() IS 'Aggressively cleans up all orphaned data from deleted users';
COMMENT ON FUNCTION public.can_reuse_email(TEXT) IS 'Checks if an email can be reused for registration';
COMMENT ON FUNCTION public.manual_delete_user(TEXT) IS 'Manually deletes all data for a specific user by email';

-- Step 11: Execute the cleanup immediately
SELECT public.force_cleanup_deleted_users(); 