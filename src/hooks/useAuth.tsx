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
      // First, try to create the user without metadata to avoid trigger issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // Don't include metadata initially to avoid trigger issues
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

      // If signup was successful, manually create the profile
      if (data.user) {
        try {
          const cleanUsername = (username || email.split('@')[0])
            .replace(/[^a-zA-Z0-9_]/g, '')
            .substring(0, 20);
          
          console.log('Creating profile with username:', cleanUsername);
          
          // Create the profile (trigger won't interfere now)
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              username: cleanUsername || 'user'
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            console.log('Profile created successfully');
          }
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
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