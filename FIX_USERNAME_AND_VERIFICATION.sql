-- FIX USERNAME AND EMAIL VERIFICATION ISSUES
-- Execute this script in your Supabase SQL Editor

-- Step 1: Fix the handle_new_user function to use metadata correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
  max_attempts INTEGER := 100;
BEGIN
  -- Get username from metadata first, then fallback to email
  base_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    split_part(NEW.email, '@', 1)
  );
  
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
  
  -- Log the username creation for debugging
  RAISE LOG 'Created profile for user % with username: %', NEW.id, final_username;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    
    -- Try with a fallback username
    BEGIN
      INSERT INTO public.profiles (user_id, username)
      VALUES (NEW.id, 'user_' || floor(random() * 100000)::TEXT);
      RAISE LOG 'Created fallback profile for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        -- If even the fallback fails, just return NEW without creating profile
        RAISE LOG 'Fallback username also failed for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Clean up any existing profiles that might have wrong usernames
-- This will allow the trigger to recreate them with correct usernames
DELETE FROM public.profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE created_at > now() - interval '1 hour'
  AND raw_user_meta_data ->> 'username' IS NOT NULL
);

-- Step 4: Create a function to check email verification status
CREATE OR REPLACE FUNCTION public.is_email_verified(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a function to get user verification status
CREATE OR REPLACE FUNCTION public.get_user_verification_status(user_id UUID)
RETURNS TABLE (
  is_verified BOOLEAN,
  email_confirmed_at TIMESTAMPTZ,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    email_confirmed_at IS NOT NULL as is_verified,
    email_confirmed_at,
    email
  FROM auth.users 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation with proper username from metadata';
COMMENT ON FUNCTION public.is_email_verified(UUID) IS 'Checks if a user email is verified';
COMMENT ON FUNCTION public.get_user_verification_status(UUID) IS 'Gets user email verification status';

-- Step 7: Show current users and their verification status
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.username,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Verified'
    ELSE 'Not Verified'
  END as verification_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 10; 