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

    try {
      console.log('Creating mentions for:', mentionedUsernames);
      
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
        // For now, just show toast notifications since mentions table might not exist
        profiles.forEach(profile => {
          toast({
            title: `Mentioned ${profile.username}`,
            description: `You mentioned ${profile.username} in a debate`,
          });
        });

        // Try to insert into mentions table if it exists
        try {
          const mentionsToInsert = profiles.map(profile => ({
            message_id: messageId,
            mentioned_user_id: profile.user_id,
            mentioned_by_id: user.id,
            room_id: roomId
          }));

          console.log('Inserting mentions:', mentionsToInsert);

          const { error } = await supabase
            .from('mentions')
            .insert(mentionsToInsert);

          if (error) {
            console.error('Error creating mentions (table might not exist):', error);
          } else {
            console.log('Mentions created successfully');
          }
        } catch (tableError) {
          console.log('Mentions table does not exist, skipping database insert');
        }
      }
    } catch (error) {
      console.error('Error creating mentions:', error);
    }
  };

  const subscribeToNewMentions = () => {
    if (!user) return;

    // Subscribe to new messages to detect mentions in real-time
    const channel = supabase
      .channel('mentions_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id.neq.${user.id}` // Only messages from other users
        },
        async (payload) => {
          const messageContent = payload.new.content;
          const mentionedUsernames = extractMentions(messageContent);
          
          // Check if current user is mentioned
          const currentUserMentioned = mentionedUsernames.some(username => {
            // Get current user's username
            const currentUsername = user.email?.split('@')[0] || user.id;
            return username.toLowerCase() === currentUsername.toLowerCase();
          });

          if (currentUserMentioned) {
            // Get the mentioner's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('user_id', payload.new.user_id)
              .single();

            // Get the room title
            const { data: room } = await supabase
              .from('debate_rooms')
              .select('title')
              .eq('id', payload.new.room_id)
              .single();

            const newMention: Mention = {
              id: `mention_${payload.new.id}_${Date.now()}`, // Generate unique ID
              message_id: payload.new.id,
              mentioned_user_id: user.id,
              mentioned_by_id: payload.new.user_id,
              room_id: payload.new.room_id,
              is_read: false,
              created_at: payload.new.created_at,
              mentioned_by_profile: profile,
              message_content: messageContent,
              room_title: room?.title || ''
            };

            setMentions(prev => [newMention, ...prev.slice(0, 49)]);
            setUnreadMentions(prev => prev + 1);

            // Show toast notification
            toast({
              title: `You were mentioned by ${profile?.username || 'Someone'}`,
              description: messageContent.length > 50 
                ? `${messageContent.substring(0, 50)}...` 
                : messageContent,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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