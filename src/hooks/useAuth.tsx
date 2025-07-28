import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any; user?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  checkEmailVerification: () => Promise<{ error: any; user?: any }>;
  checkEmailAvailability: (email: string) => Promise<{ available: boolean; error?: any }>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; error?: any }>;
  verifyOtpCode: (email: string, code: string) => Promise<{ success: boolean; error?: any }>;
  resendOtpCode: (email: string) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('useAuth signUp called with:', { email, username });
    
    try {
      // Create the user with metadata including username
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username || email.split('@')[0]
          }
        }
      });

      // Handle specific error cases
      if (error) {
        let errorMessage = error.message;
        
        // Check if it's an email already in use error
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists')) {
          errorMessage = 'Este email já está em uso. Se você deletou sua conta anteriormente, pode levar alguns minutos para que o email seja liberado. Tente novamente em alguns minutos ou use um email diferente.';
        } else if (error.message.includes('Database error') || error.message.includes('500')) {
          errorMessage = 'Erro no servidor. Tente novamente em alguns minutos ou entre em contato com o suporte.';
        }
        
        return { error: { ...error, message: errorMessage } };
      }

      // The trigger should handle profile creation automatically
      // But let's verify and create if needed
      if (data.user) {
        try {
          // Check if profile was created by trigger
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', data.user.id)
            .single();

          if (profileError || !profileData) {
            // Profile wasn't created by trigger, create it manually
            const cleanUsername = (username || email.split('@')[0])
              .replace(/[^a-zA-Z0-9_]/g, '')
              .substring(0, 20);
            
            console.log('Creating profile manually with username:', cleanUsername);
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                user_id: data.user.id,
                username: cleanUsername || 'user'
              });

            if (insertError) {
              console.error('Error creating profile manually:', insertError);
            } else {
              console.log('Profile created manually successfully');
            }
          } else {
            console.log('Profile created by trigger with username:', profileData.username);
          }
        } catch (profileError) {
          console.error('Error checking/creating profile:', profileError);
        }
      }
      
      // Return the user data so the verification flow works
      return { error, user: data.user };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return { 
        error: { 
          message: 'Erro inesperado. Tente novamente em alguns minutos.' 
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google OAuth sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        return { error };
      }
      
      console.log('Google OAuth initiated successfully:', data);
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during Google OAuth:', error);
      return { error };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    return { error };
  };

  const checkEmailVerification = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { error, user };
  };

  const checkEmailAvailability = async (email: string) => {
    try {
      // Use a different approach that doesn't create accounts
      // We'll check if the email exists by trying to sign in with a dummy password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy_password_for_check_only',
      });

      // If we get a "Invalid login credentials" error, the email exists but password is wrong
      // This means the email is already registered
      if (error && error.message.includes('Invalid login credentials')) {
        return { available: false };
      }

      // If we get a "User not found" error, the email is available
      if (error && error.message.includes('User not found')) {
        return { available: true };
      }

      // For other errors, we'll assume the email might be available
      // This is safer than creating accounts
      return { available: true };
    } catch (error) {
      // If there's an unexpected error, assume available to be safe
      return { available: true, error };
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    console.log('Checking username availability for:', username);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle(); // Use maybeSingle instead of single

      console.log('Username check result:', { data, error });

      if (error) {
        console.error('Error checking username availability:', error);
        return { available: true, error }; // Assume available on error
      }

      // If data is null, username is available
      if (!data) {
        console.log('Username is available:', username);
        return { available: true }; // Username available
      }

      // If data exists, username is already in use
      console.log('Username is already taken:', username);
      return { available: false }; // Username already in use
    } catch (error) {
      console.error('Unexpected error during username availability check:', error);
      return { available: true, error }; // Assume available on error
    }
  };

  const verifyOtpCode = async (email: string, code: string) => {
    try {
      console.log('Verifying OTP code for:', email);
      
      // For now, we'll use a simple test code
      // In a real implementation, you would check against the database
      if (code === '123456') {
        // Mark user email as confirmed
        const { error: userUpdateError } = await supabase.auth.updateUser({ 
          data: { email_confirmed_at: new Date().toISOString() } 
        });
        
        if (userUpdateError) {
          console.error('Error updating user:', userUpdateError);
          return { success: false, error: userUpdateError };
        }

        return { success: true };
      }
      
      return { success: false, error: { message: 'Invalid code' } };
    } catch (error) {
      console.error('Unexpected error during OTP verification:', error);
      return { success: false, error };
    }
  };

  const resendOtpCode = async (email: string) => {
    try {
      console.log('Resending OTP code to:', email);
      
      // For now, we'll just return success
      // In a real implementation, you would generate and send a new code
      console.log('OTP code would be sent to:', email);
      console.log('Test code: 123456');
      return { success: true, code: '123456' };
    } catch (error) {
      console.error('Unexpected error during OTP resend:', error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    // Clear localStorage for deleted notifications and mentions
    if (user) {
      localStorage.removeItem(`deleted_notifications_${user.id}`);
      localStorage.removeItem(`deleted_mentions_${user.id}`);
    }
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resendVerificationEmail,
    checkEmailVerification,
    checkEmailAvailability,
    checkUsernameAvailability,
    verifyOtpCode,
    resendOtpCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};