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
      
      // Get user's profile to find their username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!profile?.username) {
        console.log('User profile not found');
        setMentions([]);
        setUnreadMentions(0);
        return;
      }

      // Find recent messages that mention this user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          user_id,
          room_id,
          created_at,
          profiles:user_id (username, avatar_url),
          debate_rooms:room_id (title)
        `)
        .neq('user_id', user.id) // Don't include user's own messages
        .ilike('content', `%@${profile.username}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching mentions:', error);
        setMentions([]);
        setUnreadMentions(0);
        return;
      }

      if (messages) {
        const mentionsData = messages.map(msg => ({
          id: `mention_${msg.id}`,
          message_id: msg.id,
          mentioned_user_id: user.id,
          mentioned_by_id: msg.user_id,
          room_id: msg.room_id,
          is_read: false, // For now, treat all as unread
          created_at: msg.created_at,
          mentioned_by_profile: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
          message_content: msg.content,
          room_title: Array.isArray(msg.debate_rooms) ? msg.debate_rooms[0]?.title : msg.debate_rooms?.title
        }));

        setMentions(mentionsData);
        setUnreadMentions(mentionsData.length);
        console.log('Found mentions:', mentionsData.length);
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      setMentions([]);
      setUnreadMentions(0);
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
          const currentUserMentioned = await (async () => {
            // Get current user's username from profile
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', user.id)
              .single();

            if (!currentProfile?.username) return false;

            return mentionedUsernames.some(username => 
              username.toLowerCase() === currentProfile.username.toLowerCase()
            );
          })();

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