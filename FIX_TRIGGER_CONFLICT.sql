-- FIX TRIGGER CONFLICT
-- This fixes the issue where the automatic trigger conflicts with manual profile creation

-- Step 1: Disable the automatic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create a new function that doesn't create profiles automatically
-- This way, our frontend code will handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Do nothing - let the frontend handle profile creation
  -- This prevents conflicts between automatic and manual profile creation
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger (but it won't create profiles automatically)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Clean up any existing profiles that might have wrong usernames
-- This will allow our frontend code to create profiles with correct usernames
DELETE FROM public.profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE created_at > now() - interval '1 hour'
);

-- This fix will:
-- 1. Stop automatic profile creation by the trigger
-- 2. Let our frontend code handle profile creation with correct usernames
-- 3. Clean up any profiles created in the last hour (so they can be recreated)
-- 4. Allow the verification flow to work properly

-- After this is applied:
-- - Usernames will be set correctly by our frontend code
-- - Email verification should work properly
-- - No more conflicts between automatic and manual profile creation 