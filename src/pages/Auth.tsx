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
import { GoogleOAuthTest } from '@/components/ui/google-oauth-test';
import { EmailVerification } from '@/components/ui/email-verification';
import { EmailHelp } from '@/components/ui/email-help';
import { DatabaseError } from '@/components/ui/database-error';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showEmailHelp, setShowEmailHelp] = useState(false);
  const [showDatabaseError, setShowDatabaseError] = useState(false);
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });

    if (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };



  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }



    // Validate password strength
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Signing up with:', { email, username, password: '***' });
      const { error, user } = await signUp(email, password, username);
      console.log('Signup result:', { error, user: user?.id });
      
      if (error) {
        // Check if it's an email already in use error
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists')) {
          setShowEmailHelp(true);
        } else if (error.message.includes('Database error') || error.message.includes('500')) {
          setShowDatabaseError(true);
        } else {
          toast({
            title: "Sign up error",
            description: error.message,
            variant: "destructive",
          });
        }
              } else {
          console.log('Signup successful, showing verification screen');
          // Show email verification screen
          setVerificationEmail(email);
          setShowEmailVerification(true);
          
          // Upload avatar if provided
          if (avatarFile && user) {
            setTimeout(async () => {
              const avatarUrl = await uploadAvatar(user.id);
              if (avatarUrl) {
                await supabase
                  .from('profiles')
                  .update({ avatar_url: avatarUrl })
                  .eq('user_id', user.id);
              }
            }, 1000);
          }

          toast({
            title: "Account created successfully!",
            description: "Please check your email to verify your account.",
          });
        }
    } catch (error) {
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Check if the error is related to email verification
        if (error.message.includes('Email not confirmed') || error.message.includes('Invalid login credentials')) {
          toast({
            title: "Email verification required",
            description: "Please verify your email address before signing in. Check your inbox for the verification link.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Login successful!",
          description: "Welcome back to Turf!",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowEmailVerification(false);
    setVerificationEmail('');
    // Clear form fields
    setEmail('');
    setPassword('');
    setUsername('');
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleDatabaseErrorRetry = () => {
    setShowDatabaseError(false);
    // The form will be ready for retry
  };

  const handleDatabaseErrorClose = () => {
    setShowDatabaseError(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Starting Google sign in process...');
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('Google sign in error:', error);
        
        let errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('provider is not enabled')) {
          errorMessage = 'Google OAuth is not configured. Please contact the administrator.';
        } else if (error.message.includes('Invalid redirect URI')) {
          errorMessage = 'Invalid redirect configuration. Please try again.';
        } else if (error.message.includes('popup_closed')) {
          errorMessage = 'Sign in was cancelled. Please try again.';
        }
        
        toast({
          title: "Google sign in error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Redirecting to Google...",
          description: "Please complete the sign in process.",
        });
      }
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
      toast({
        title: "Unexpected error",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background flex items-center justify-center p-4">
      {showEmailVerification ? (
        <EmailVerification 
          email={verificationEmail}
          onVerificationComplete={handleVerificationComplete}
        />
      ) : showEmailHelp ? (
        <EmailHelp onClose={() => setShowEmailHelp(false)} />
      ) : showDatabaseError ? (
        <DatabaseError 
          onRetry={handleDatabaseErrorRetry}
          onClose={handleDatabaseErrorClose}
        />
      ) : (
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
                
                {/* Debug section - only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebug(!showDebug)}
                      className="w-full text-xs"
                    >
                      {showDebug ? "Hide Debug" : "Show Debug"}
                    </Button>
                    {showDebug && (
                      <div className="mt-2">
                        <GoogleOAuthTest />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                                  <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

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
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="yourname"
                      required
                    />
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
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
                
                {/* Debug section - only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebug(!showDebug)}
                      className="w-full text-xs"
                    >
                      {showDebug ? "Hide Debug" : "Show Debug"}
                    </Button>
                    {showDebug && (
                      <div className="mt-2">
                        <GoogleOAuthTest />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}