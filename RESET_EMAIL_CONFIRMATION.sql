-- RESET EMAIL CONFIRMATION FOR TESTING
-- Execute this script in your Supabase SQL Editor to reset email confirmation

-- Reset email_confirmed_at for all users (for testing)
UPDATE auth.users 
SET email_confirmed_at = NULL 
WHERE email = 'danieloliveiragamer8@gmail.com';

-- Show current status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'danieloliveiragamer8@gmail.com';

-- Also reset for any other test users
UPDATE auth.users 
SET email_confirmed_at = NULL 
WHERE email_confirmed_at IS NOT NULL;

-- Show all users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10; 