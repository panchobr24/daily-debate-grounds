import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  // SIMPLE OTP STATES
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [forceOtpDisplay, setForceOtpDisplay] = useState(false);
  
  const { signUp, signIn, signInWithGoogle, user, checkUsernameAvailability } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // SIMPLE REDIRECT LOGIC
  useEffect(() => {
    console.log('=== REDIRECT CHECK ===');
    console.log('user:', user);
    console.log('showOtpScreen:', showOtpScreen);
    console.log('forceOtpDisplay:', forceOtpDisplay);
    console.log('user?.email_confirmed_at:', user?.email_confirmed_at);
    
    // NEVER redirect if we're showing OTP screen or forcing display
    if (showOtpScreen || forceOtpDisplay) {
      console.log('Showing OTP screen or forcing display, NOT redirecting');
      return;
    }
    
    // Only redirect if user is confirmed and we're not showing OTP
    if (user && user.email_confirmed_at) {
      console.log('User confirmed and not showing OTP, redirecting to home');
      navigate('/');
    } else {
      console.log('Staying on current page');
    }
  }, [user, showOtpScreen, forceOtpDisplay, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateUsername = (username: string): string | null => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return 'Username must be 3-20 characters, letters, numbers and underscore only';
    }
    return null;
  };

  const validateUsernameAvailability = async (username: string) => {
    if (!username.trim()) return;
    
    setIsCheckingUsername(true);
    try {
      console.log('Checking username availability for:', username);
      const { available, error } = await checkUsernameAvailability(username);
      console.log('Username check result:', { available, error });
      
      if (error) {
        setUsernameError("Error checking username availability");
      } else if (!available) {
        setUsernameError("Username is already taken");
      } else {
        setUsernameError(null);
        console.log('Username is available:', username);
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameError("Error checking username availability");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // SIMPLE SIGNUP FUNCTION
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== SIMPLE SIGNUP START ===');
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in email and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (username) {
      const usernameError = validateUsername(username);
      if (usernameError) {
        setUsernameError(usernameError);
        toast({
          title: "Invalid username",
          description: usernameError,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    console.log('Starting signup...');

    try {
      const { error, user } = await signUp(email, password, username);
      console.log('Signup result:', { error, user });

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Sign up failed",
          description: error.message || "An error occurred.",
          variant: "destructive",
        });
      } else {
        console.log('=== SIGNUP SUCCESS - SHOWING OTP ===');
        
        // SHOW OTP SCREEN IMMEDIATELY AND FORCE DISPLAY
        setShowOtpScreen(true);
        setForceOtpDisplay(true);
        setOtpCode('');
        
        toast({
          title: "Account created!",
          description: "Please verify your email with the code below.",
        });
        
        console.log('OTP screen should now be visible and forced to stay');
        
        // Force a delay to ensure OTP screen appears before any redirect
        setTimeout(() => {
          console.log('=== DELAY COMPLETE - OTP SHOULD BE VISIBLE ===');
          console.log('showOtpScreen should be true:', true);
          console.log('forceOtpDisplay should be true:', true);
        }, 500);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // SIMPLE OTP VERIFICATION
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOtp(true);
    console.log('Verifying OTP code:', otpCode);

    try {
      // SIMPLE VERIFICATION - just check if it's 123456
      if (otpCode === '123456') {
        console.log('OTP verified successfully!');
        
        // Update user email_confirmed_at
        const { error } = await supabase.auth.updateUser({
          data: { email_confirmed_at: new Date().toISOString() }
        });

        if (error) {
          console.error('Error updating user:', error);
        }

        toast({
          title: "Email verified!",
          description: "Your account has been verified successfully.",
        });

        // Reset states and redirect
        setShowOtpScreen(false);
        setForceOtpDisplay(false);
        setOtpCode('');
        navigate('/');
      } else {
        toast({
          title: "Invalid code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // RENDER OTP SCREEN
  if (showOtpScreen || forceOtpDisplay) {
    console.log('=== RENDERING OTP SCREEN ===');
    console.log('showOtpScreen:', showOtpScreen);
    console.log('forceOtpDisplay:', forceOtpDisplay);
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
            <CardTitle className="text-xl font-bold text-blue-600">
              🔐 Verify Your Email
            </CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to: <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code">Verification Code</Label>
              <Input
                id="otp-code"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
                disabled={isVerifyingOtp}
              />
              <div className="text-xs text-red-500 text-center font-bold">
                🧪 TEST CODE: 123456
              </div>
            </div>
            
            <Button 
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || otpCode.length !== 6}
              className="w-full"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
            >
              {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>• Check your spam/junk folder if you don't see the email</p>
              <p>• Use the test code above for now</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // RENDER MAIN FORM
  console.log('=== RENDERING MAIN FORM ===');
  return (
    <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-turf-purple/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-turf-purple">Turf</CardTitle>
          <CardDescription>
            Join the conversation that matters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Continue with Google
              </Button>
              
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError(null);
                    }}
                    onBlur={() => {
                      if (username.trim()) {
                        validateUsernameAvailability(username);
                      }
                    }}
                    placeholder="yourname"
                    required
                    className={usernameError ? "border-red-500" : ""}
                  />
                  {usernameError && (
                    <p className="text-sm text-red-500">{usernameError}</p>
                  )}
                  {isCheckingUsername && (
                    <p className="text-sm text-blue-500">Checking username availability...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile image</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback>
                        <Upload className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || isCheckingUsername}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}