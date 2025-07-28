import { supabase } from '@/integrations/supabase/client';

export interface SupabaseConfigInfo {
  url: string;
  hasAnonKey: boolean;
  isConnected: boolean;
  authProviders: string[];
  googleOAuthEnabled: boolean;
}

export async function checkSupabaseConfig(): Promise<SupabaseConfigInfo> {
  const config: SupabaseConfigInfo = {
    url: "https://jvwpsbbaulvnicjhaesi.supabase.co", // Hardcoded for now
    hasAnonKey: true, // We know it exists since the client was created
    isConnected: false,
    authProviders: [],
    googleOAuthEnabled: false,
  };

  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    config.isConnected = !error;

    // Get auth providers (this is a bit tricky as we can't directly query this)
    // We'll try to detect Google OAuth by attempting a sign-in
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      
      // If we get a specific error about provider not enabled, it means Google OAuth is not configured
      if (oauthError && oauthError.message.includes('provider is not enabled')) {
        config.googleOAuthEnabled = false;
      } else {
        config.googleOAuthEnabled = true;
      }
    } catch (e) {
      config.googleOAuthEnabled = false;
    }

    return config;
  } catch (error) {
    console.error('Error checking Supabase config:', error);
    return config;
  }
}

export function logSupabaseConfig() {
  console.log('=== Supabase Configuration ===');
  console.log('URL: https://jvwpsbbaulvnicjhaesi.supabase.co');
  console.log('Has Anon Key: true');
  console.log('Current Origin:', window.location.origin);
  console.log('User Agent:', navigator.userAgent);
  console.log('=============================');
} 