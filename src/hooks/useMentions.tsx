import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Mention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  mentioned_by_id: string;
  room_id: string;
  is_read: boolean;
  created_at: string;
  mentioned_by_profile?: {
    username: string;
    avatar_url: string | null;
  };
  message_content?: string;
  room_title?: string;
}

export const useMentions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [unreadMentions, setUnreadMentions] = useState(0);
  const [loading, setLoading] = useState(false);

    const fetchMentions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Fetching mentions for user:', user.id);
      
      // Since mentions table doesn't exist, we'll use a different approach
      // For now, just set empty mentions
      setMentions([]);
      setUnreadMentions(0);
      console.log('Mentions table does not exist, using empty state');
      
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMentionAsRead = async (mentionId: string) => {
    // For now, just update local state since is_read column doesn't exist
    setMentions(prev => 
      prev.map(mention => 
        mention.id === mentionId 
          ? { ...mention, is_read: true }
          : mention
      )
    );
    setUnreadMentions(prev => Math.max(0, prev - 1));
  };

  const markAllMentionsAsRead = async () => {
    // For now, just update local state since is_read column doesn't exist
    setMentions(prev => 
      prev.map(mention => ({ ...mention, is_read: true }))
    );
    setUnreadMentions(0);
  };

  const createMentions = async (messageId: string, roomId: string, mentionedUsernames: string[]) => {
    if (!user || mentionedUsernames.length === 0) return;

    console.log('Creating mentions for:', mentionedUsernames);
    
    try {
      // Get user IDs for mentioned usernames
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('username', mentionedUsernames);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      console.log('Found profiles:', profiles);

      if (profiles && profiles.length > 0) {
        // Just show toast notifications for mentions (no database operations)
        profiles.forEach(profile => {
          toast({
            title: `Mentioned ${profile.username}`,
            description: `You mentioned ${profile.username} in a debate`,
          });
        });
      }
    } catch (error) {
      console.error('Error creating mentions:', error);
    }
  };

  const subscribeToNewMentions = () => {
    if (!user) return;

    // For now, don't subscribe to anything since mentions table doesn't exist
    console.log('Mentions subscription disabled - table does not exist');
    
    return () => {
      // No cleanup needed
    };
  };

  // Helper function to extract mentions from message content
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    
    return matches.map(match => match.slice(1)); // Remove @ symbol
  };

  useEffect(() => {
    if (user) {
      fetchMentions();
      const unsubscribe = subscribeToNewMentions();
      return unsubscribe;
    }
  }, [user]);

  return {
    mentions,
    unreadMentions,
    loading,
    fetchMentions,
    markMentionAsRead,
    markAllMentionsAsRead,
    createMentions
  };
}; 