-- Add unique username constraint and improve email verification
-- This ensures usernames are unique and improves the verification system

-- Step 1: Add unique constraint to username column
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Step 2: Create a function to check username availability
CREATE OR REPLACE FUNCTION public.is_username_available(username_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = username_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a function to generate unique username
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
  final_username TEXT;
  counter INTEGER := 1;
  max_attempts INTEGER := 100;
BEGIN
  -- Clean the base username
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
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update the handle_new_user function to use the new unique username generator
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Get username from metadata first, then fallback to email
  base_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate unique username
  final_username := public.generate_unique_username(base_username);
  
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

-- Step 5: Create a function to update username (for existing users)
CREATE OR REPLACE FUNCTION public.update_username(user_id UUID, new_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  unique_username TEXT;
BEGIN
  -- Generate unique username
  unique_username := public.generate_unique_username(new_username);
  
  -- Update the username
  UPDATE public.profiles 
  SET username = unique_username
  WHERE user_id = update_username.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create a function to check email verification status
CREATE OR REPLACE FUNCTION public.get_email_verification_status(user_email TEXT)
RETURNS TABLE (
  is_verified BOOLEAN,
  email_confirmed_at TIMESTAMPTZ,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    email_confirmed_at IS NOT NULL as is_verified,
    email_confirmed_at,
    id as user_id
  FROM auth.users 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add comments
COMMENT ON FUNCTION public.is_username_available(TEXT) IS 'Checks if a username is available';
COMMENT ON FUNCTION public.generate_unique_username(TEXT) IS 'Generates a unique username';
COMMENT ON FUNCTION public.update_username(UUID, TEXT) IS 'Updates username for existing user';
COMMENT ON FUNCTION public.get_email_verification_status(TEXT) IS 'Gets email verification status by email';

-- Step 8: Show current usernames to check for duplicates
SELECT 
  username,
  COUNT(*) as count
FROM public.profiles 
GROUP BY username 
HAVING COUNT(*) > 1
ORDER BY count DESC; 