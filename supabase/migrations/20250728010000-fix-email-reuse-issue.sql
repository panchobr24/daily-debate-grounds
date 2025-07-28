-- Fix email reuse issue after account deletion
-- This migration addresses the problem where deleted accounts prevent email reuse

-- First, let's clean up orphaned profiles (profiles without corresponding auth.users)
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up orphaned messages
DELETE FROM public.messages 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up orphaned reactions
DELETE FROM public.message_reactions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Update the handle_new_user function to handle username conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Get base username from metadata or email
  base_username := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  
  -- Ensure username is not null or empty
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;
  
  -- Clean the username (remove special characters, limit length)
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  base_username := substring(base_username from 1 for 20);
  
  -- If username is empty after cleaning, use 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;
  
  -- Check if username exists and generate a unique one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || counter::TEXT;
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 1000 THEN
      final_username := base_username || '_' || floor(random() * 10000)::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the profile with the unique username
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, final_username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually clean up deleted user data
CREATE OR REPLACE FUNCTION public.cleanup_deleted_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Count and delete orphaned profiles
  DELETE FROM public.profiles 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete orphaned messages
  DELETE FROM public.messages 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  -- Delete orphaned reactions
  DELETE FROM public.message_reactions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if email can be reused
CREATE OR REPLACE FUNCTION public.can_reuse_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there's an active user with this email
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = email_address 
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.message_reactions(user_id);

-- Add a comment to document the fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation with unique username generation and conflict resolution';
COMMENT ON FUNCTION public.cleanup_deleted_users() IS 'Cleans up orphaned data from deleted users';
COMMENT ON FUNCTION public.can_reuse_email(TEXT) IS 'Checks if an email can be reused for registration'; 