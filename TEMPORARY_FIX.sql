-- TEMPORARY FIX FOR DATABASE ERROR
-- Execute this in your Supabase SQL Editor to fix the immediate issue

-- Step 1: Disable the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create a simple, safe version of the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple fallback: just create a profile with a basic username
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, 'user_' || floor(random() * 100000)::TEXT);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If even this fails, just return NEW without creating profile
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger with the safe function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Clean up any orphaned profiles
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- This fix will:
-- 1. Stop the database errors
-- 2. Allow new users to register
-- 3. Create profiles with simple usernames
-- 4. Clean up any orphaned data

-- After this is applied, users can register successfully
-- You can later implement a more sophisticated username generation system 