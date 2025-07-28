-- FIX USERNAME CHECK ERROR
-- Execute this script in your Supabase SQL Editor

-- Step 1: Ensure the unique constraint exists
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

-- Step 4: Update the handle_new_user function
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

-- Step 5: Add comments
COMMENT ON FUNCTION public.is_username_available(TEXT) IS 'Checks if a username is available';
COMMENT ON FUNCTION public.generate_unique_username(TEXT) IS 'Generates a unique username';

-- Step 6: Test the functions
SELECT public.is_username_available('test_username');
SELECT public.generate_unique_username('test');

-- Step 7: Show current usernames
SELECT username, COUNT(*) as count
FROM public.profiles 
GROUP BY username 
ORDER BY count DESC
LIMIT 10; 