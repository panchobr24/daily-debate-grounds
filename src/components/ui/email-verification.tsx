import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export function EmailVerification({ email, onVerificationComplete }: EmailVerificationProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'error'>('pending');
  const { checkEmailVerification, resendVerificationEmail } = useAuth();
  const { toast } = useToast();

  const checkVerification = async () => {
    setIsChecking(true);
    try {
      const { error, user } = await checkEmailVerification();
      
      if (error) {
        console.error('Error checking verification:', error);
        setVerificationStatus('error');
        toast({
          title: "Verification check failed",
          description: "Please try again in a few moments.",
          variant: "destructive",
        });
      } else if (user?.email_confirmed_at) {
        setVerificationStatus('verified');
        toast({
          title: "Email verified successfully!",
          description: "You can now sign in to your account.",
        });
        setTimeout(() => {
          onVerificationComplete();
        }, 2000);
      } else {
        setVerificationStatus('pending');
        toast({
          title: "Email not yet verified",
          description: "Please check your email and click the verification link.",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setVerificationStatus('error');
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await resendVerificationEmail(email);
      
      if (error) {
        toast({
          title: "Failed to resend verification email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and spam folder.",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    // Check verification status immediately when component mounts
    checkVerification();
  }, []);

  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-turf-purple/20">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {verificationStatus === 'verified' ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : verificationStatus === 'error' ? (
            <AlertCircle className="h-12 w-12 text-red-500" />
          ) : (
            <Mail className="h-12 w-12 text-turf-purple" />
          )}
        </div>
        <CardTitle className="text-xl font-bold text-turf-purple">
          {verificationStatus === 'verified' 
            ? 'Email Verified!' 
            : 'Verify Your Email'
          }
        </CardTitle>
        <CardDescription>
          {verificationStatus === 'verified' 
            ? 'Your email has been successfully verified. You can now sign in to your account.'
            : 'We sent a verification link to your email address. Please check your inbox and click the link to verify your account.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStatus !== 'verified' && (
          <>
            <div className="text-center text-sm text-muted-foreground">
              Email: <span className="font-medium">{email}</span>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={checkVerification} 
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Verification Status'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>• Check your spam/junk folder if you don't see the email</p>
              <p>• The verification link expires in 24 hours</p>
              <p>• You can request a new verification email if needed</p>
            </div>
          </>
        )}
        
        {verificationStatus === 'verified' && (
          <div className="text-center">
            <Button 
              onClick={onVerificationComplete}
              className="w-full"
            >
              Continue to Sign In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 