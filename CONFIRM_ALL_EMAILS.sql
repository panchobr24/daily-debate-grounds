-- CONFIRM ALL EMAILS FOR TESTING
-- Execute this script in your Supabase SQL Editor to confirm all emails

-- Confirm email for all users
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- Show current status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Also update the profiles table to ensure all users have profiles
INSERT INTO public.profiles (user_id, username)
SELECT 
  id as user_id,
  COALESCE(
    raw_user_meta_data->>'username',
    split_part(email, '@', 1)
  ) as username
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Show profiles status
SELECT 
  p.user_id,
  p.username,
  u.email,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10; 