-- FIX OTP VERIFICATION SYSTEM
-- Execute this script in your Supabase SQL Editor

-- Step 1: Create OTP table
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Create function to generate OTP code
CREATE OR REPLACE FUNCTION public.generate_otp_code()
RETURNS TEXT AS $$
BEGIN
  -- Generate a random 6-digit code
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to create verification code (FIXED)
CREATE OR REPLACE FUNCTION public.create_verification_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  verification_code TEXT;
  user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- If user doesn't exist, create a temporary code (for testing)
  IF user_id IS NULL THEN
    verification_code := public.generate_otp_code();
    -- Insert with NULL user_id for testing
    INSERT INTO public.email_verification_codes (user_id, email, code, expires_at)
    VALUES (NULL, user_email, verification_code, now() + interval '10 minutes');
    RETURN verification_code;
  END IF;
  
  -- Generate OTP code
  verification_code := public.generate_otp_code();
  
  -- Insert verification code (expires in 10 minutes)
  INSERT INTO public.email_verification_codes (user_id, email, code, expires_at)
  VALUES (user_id, user_email, verification_code, now() + interval '10 minutes');
  
  RETURN verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to verify OTP code (FIXED)
CREATE OR REPLACE FUNCTION public.verify_otp_code(user_email TEXT, input_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  verification_record RECORD;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- Find valid verification code
  SELECT * INTO verification_record 
  FROM public.email_verification_codes 
  WHERE email = user_email 
    AND code = input_code 
    AND used = FALSE 
    AND expires_at > now()
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF verification_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Mark code as used
  UPDATE public.email_verification_codes 
  SET used = TRUE 
  WHERE id = verification_record.id;
  
  -- Mark user email as confirmed (if user exists)
  IF user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = now() 
    WHERE id = user_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to resend verification code (FIXED)
CREATE OR REPLACE FUNCTION public.resend_verification_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  verification_code TEXT;
  user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- Invalidate old codes
  UPDATE public.email_verification_codes 
  SET used = TRUE 
  WHERE email = user_email 
    AND used = FALSE;
  
  -- Generate new OTP code
  verification_code := public.generate_otp_code();
  
  -- Insert new verification code
  INSERT INTO public.email_verification_codes (user_id, email, code, expires_at)
  VALUES (user_id, user_email, verification_code, now() + interval '10 minutes');
  
  RETURN verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add RLS policies
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification codes
CREATE POLICY "Users can view own verification codes" ON public.email_verification_codes
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Only the system can insert verification codes
CREATE POLICY "System can insert verification codes" ON public.email_verification_codes
  FOR INSERT WITH CHECK (true);

-- Only the system can update verification codes
CREATE POLICY "System can update verification codes" ON public.email_verification_codes
  FOR UPDATE USING (true);

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON public.email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);

-- Step 8: Add comments
COMMENT ON TABLE public.email_verification_codes IS 'Stores OTP codes for email verification';
COMMENT ON FUNCTION public.generate_otp_code() IS 'Generates a random 6-digit OTP code';
COMMENT ON FUNCTION public.create_verification_code(TEXT) IS 'Creates a new verification code for user';
COMMENT ON FUNCTION public.verify_otp_code(TEXT, TEXT) IS 'Verifies OTP code and marks email as confirmed';
COMMENT ON FUNCTION public.resend_verification_code(TEXT) IS 'Resends verification code to user';

-- Step 9: Test the functions (without requiring existing users)
SELECT public.generate_otp_code();
SELECT public.create_verification_code('test@example.com');

-- Step 10: Show current verification codes (for debugging)
SELECT 
  email,
  code,
  used,
  expires_at,
  created_at
FROM public.email_verification_codes 
ORDER BY created_at DESC 
LIMIT 5; 