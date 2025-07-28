-- SIMPLE OTP TEST
-- Execute this script in your Supabase SQL Editor

-- Step 1: Create OTP table (if not exists)
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Create simple function to generate OTP
CREATE OR REPLACE FUNCTION public.generate_otp_code()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create simple function to create verification code
CREATE OR REPLACE FUNCTION public.create_verification_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  verification_code TEXT;
BEGIN
  -- Generate OTP code
  verification_code := public.generate_otp_code();
  
  -- Insert verification code (expires in 10 minutes)
  INSERT INTO public.email_verification_codes (user_id, email, code, expires_at)
  VALUES (NULL, user_email, verification_code, now() + interval '10 minutes');
  
  RETURN verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create simple function to verify OTP code
CREATE OR REPLACE FUNCTION public.verify_otp_code(user_email TEXT, input_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  verification_record RECORD;
BEGIN
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
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create simple function to resend verification code
CREATE OR REPLACE FUNCTION public.resend_verification_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  verification_code TEXT;
BEGIN
  -- Invalidate old codes
  UPDATE public.email_verification_codes 
  SET used = TRUE 
  WHERE email = user_email 
    AND used = FALSE;
  
  -- Generate new OTP code
  verification_code := public.generate_otp_code();
  
  -- Insert new verification code
  INSERT INTO public.email_verification_codes (user_id, email, code, expires_at)
  VALUES (NULL, user_email, verification_code, now() + interval '10 minutes');
  
  RETURN verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add RLS policies
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (for testing)
CREATE POLICY "Allow all operations" ON public.email_verification_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Test the functions
SELECT 'Generated OTP:' as info, public.generate_otp_code() as code;
SELECT 'Created verification code for test@example.com:' as info, public.create_verification_code('test@example.com') as code;

-- Step 8: Show current verification codes
SELECT 
  'Current codes:' as info,
  email,
  code,
  used,
  expires_at
FROM public.email_verification_codes 
ORDER BY created_at DESC 
LIMIT 5; 