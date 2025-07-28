import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkSupabaseConfig, logSupabaseConfig } from '@/utils/supabase-config-check';

export function GoogleOAuthTest() {
  const [loading, setLoading] = useState(false);
  const [configInfo, setConfigInfo] = useState<any>(null);
  const { toast } = useToast();

  const testGoogleOAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing Google OAuth configuration...');
      logSupabaseConfig();
      
      // First check the overall config
      const config = await checkSupabaseConfig();
      setConfigInfo(config);
      
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
        console.error('Google OAuth test failed:', error);
        toast({
          title: "Google OAuth Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Google OAuth test successful:', data);
        toast({
          title: "Google OAuth Test Successful",
          description: "Configuration is working correctly!",
        });
      }
    } catch (error) {
      console.error('Unexpected error during test:', error);
      toast({
        title: "Test Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Google OAuth Test</CardTitle>
        <CardDescription>
          Test if Google OAuth is properly configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testGoogleOAuth} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Testing..." : "Test Google OAuth"}
        </Button>
        
        {configInfo && (
          <div className="text-xs space-y-2 p-3 bg-muted rounded">
            <div><strong>Connection:</strong> {configInfo.isConnected ? "✅ Connected" : "❌ Failed"}</div>
            <div><strong>Google OAuth:</strong> {configInfo.googleOAuthEnabled ? "✅ Enabled" : "❌ Disabled"}</div>
            <div><strong>URL:</strong> {configInfo.url}</div>
            <div><strong>Origin:</strong> {window.location.origin}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 