-- FORCE EMAIL REUSE CLEANUP
-- Execute this script in your Supabase SQL Editor to fix the email reuse issue

-- Step 1: Clean up all orphaned data immediately
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.messages 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.message_reactions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.mentions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.notifications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2: Create a function to check if email can be reused
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

-- Step 3: Create a function to manually delete user data by email
CREATE OR REPLACE FUNCTION public.manual_delete_user_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', user_email;
    RETURN FALSE;
  END IF;
  
  -- Delete all user data
  DELETE FROM public.profiles WHERE user_id = user_id;
  DELETE FROM public.messages WHERE user_id = user_id;
  DELETE FROM public.message_reactions WHERE user_id = user_id;
  DELETE FROM public.mentions WHERE user_id = user_id;
  DELETE FROM public.notifications WHERE user_id = user_id;
  
  RAISE NOTICE 'Deleted all data for user % (email: %)', user_id, user_email;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a function to force cleanup all orphaned data
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
  RAISE NOTICE 'Deleted % orphaned profiles', deleted_count;
  
  -- Clean up orphaned messages
  DELETE FROM public.messages 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  RAISE NOTICE 'Deleted % orphaned messages', deleted_count;
  
  -- Clean up orphaned reactions
  DELETE FROM public.message_reactions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  RAISE NOTICE 'Deleted % orphaned reactions', deleted_count;
  
  -- Clean up orphaned mentions
  DELETE FROM public.mentions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  RAISE NOTICE 'Deleted % orphaned mentions', deleted_count;
  
  -- Clean up orphaned notifications
  DELETE FROM public.notifications 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  RAISE NOTICE 'Deleted % orphaned notifications', deleted_count;
  
  RAISE NOTICE 'Total orphaned records deleted: %', total_deleted;
  RETURN total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Execute the cleanup immediately
SELECT public.force_cleanup_deleted_users();

-- Step 6: Show current orphaned data count
SELECT 
  'profiles' as table_name,
  COUNT(*) as orphaned_count
FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as orphaned_count
FROM public.messages 
WHERE user_id NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 
  'message_reactions' as table_name,
  COUNT(*) as orphaned_count
FROM public.message_reactions 
WHERE user_id NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 
  'mentions' as table_name,
  COUNT(*) as orphaned_count
FROM public.mentions 
WHERE user_id NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as orphaned_count
FROM public.notifications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 7: Instructions for manual cleanup
-- If you know the specific email that's causing issues, you can run:
-- SELECT public.manual_delete_user_by_email('your-email@example.com');
-- 
-- To check if an email can be reused:
-- SELECT public.can_reuse_email('your-email@example.com');
-- 
-- To force cleanup again:
-- SELECT public.force_cleanup_deleted_users(); 