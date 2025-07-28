import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface OtpVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export function OtpVerification({ email, onVerificationComplete }: OtpVerificationProps) {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'error'>('pending');
  const { verifyOtpCode, resendOtpCode } = useAuth();
  const { toast } = useToast();

  console.log('=== OTP COMPONENT RENDER ===');
  console.log('Email prop:', email);
  console.log('OTP Code state:', otpCode);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      console.log('=== OTP VERIFICATION DEBUG ===');
      console.log('Email:', email);
      console.log('OTP Code:', otpCode);
      console.log('Verifying OTP code for:', email);
      const { success, error } = await verifyOtpCode(email, otpCode);
      console.log('Verification result:', { success, error });
      
      if (error) {
        console.error('Error verifying OTP:', error);
        setVerificationStatus('error');
        toast({
          title: "Verification failed",
          description: error.message || "Please check your code and try again.",
          variant: "destructive",
        });
      } else if (success) {
        console.log('OTP verified successfully!');
        setVerificationStatus('verified');
        toast({
          title: "Email verified successfully!",
          description: "Your account has been verified. You can now sign in.",
        });
        setTimeout(() => {
          onVerificationComplete();
        }, 2000);
      } else {
        setVerificationStatus('error');
        toast({
          title: "Invalid code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      setVerificationStatus('error');
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      console.log('Resending OTP code to:', email);
      const { success, error } = await resendOtpCode(email);
      
      if (error) {
        console.error('Failed to resend OTP:', error);
        toast({
          title: "Failed to resend code",
          description: error.message || "Please try again in a few moments.",
          variant: "destructive",
        });
      } else if (success) {
        console.log('OTP code resent successfully');
        setTimeLeft(600); // Reset timer
        setOtpCode(''); // Clear input
        toast({
          title: "Code sent",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch (error) {
      console.error('Unexpected error during resend:', error);
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setOtpCode(numericValue);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: 'white', color: 'black' }}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationStatus === 'verified' ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : verificationStatus === 'error' ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : (
              <Mail className="h-12 w-12 text-blue-500" />
            )}
          </div>
          <CardTitle className="text-xl font-bold text-blue-600">
            {verificationStatus === 'verified' 
              ? 'Email Verified!' 
              : 'Verify Your Email'
            }
          </CardTitle>
          <CardDescription>
            {verificationStatus === 'verified' 
              ? 'Your email has been successfully verified. You can now sign in to your account.'
              : 'We sent a 6-digit verification code to your email address. Please enter it below.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {verificationStatus !== 'verified' && (
            <>
              <div className="text-center text-sm text-gray-600">
                Email: <span className="font-medium">{email}</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="otp-code" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <Input
                    id="otp-code"
                    type="text"
                    value={otpCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                    disabled={isVerifying}
                  />
                  {/* Debug: Show test code */}
                  <div className="text-xs text-red-500 text-center font-bold">
                    🧪 TEST CODE: 123456
                  </div>
                </div>
                
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isVerifying || otpCode.length !== 6}
                  className="w-full"
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Code expires in: {formatTime(timeLeft)}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleResendCode}
                  disabled={isResending || timeLeft > 0}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : timeLeft > 0 ? (
                    `Resend in ${formatTime(timeLeft)}`
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Check your spam/junk folder if you don't see the email</p>
                <p>• The verification code expires in 10 minutes</p>
                <p>• You can request a new code if needed</p>
              </div>
            </>
          )}
          
          {verificationStatus === 'verified' && (
            <div className="text-center">
              <Button 
                onClick={onVerificationComplete}
                className="w-full"
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                Continue to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 