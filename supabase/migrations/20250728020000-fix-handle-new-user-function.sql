-- Fix handle_new_user function to prevent database errors
-- This migration fixes the issue where username generation fails

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
  max_attempts INTEGER := 100;
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
    IF counter > max_attempts THEN
      final_username := base_username || '_' || floor(random() * 10000)::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the profile with the unique username
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, final_username);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (you can check this in Supabase logs)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    
    -- Try with a fallback username
    BEGIN
      INSERT INTO public.profiles (user_id, username)
      VALUES (NEW.id, 'user_' || floor(random() * 100000)::TEXT);
    EXCEPTION
      WHEN OTHERS THEN
        -- If even the fallback fails, just return NEW without creating profile
        RAISE LOG 'Fallback username also failed: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to document the fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation with robust username generation and error handling'; 