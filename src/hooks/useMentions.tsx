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

      console.log('Looking for mentions of username:', profile.username);

      // Find recent messages that mention this user with correct JOIN syntax
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          user_id,
          room_id,
          created_at
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

      console.log('Raw messages found:', messages);

      if (messages) {
        // Filter messages that actually contain the exact mention
        const actualMentions = messages.filter(msg => {
          const regex = new RegExp(`@${profile.username}\\b`, 'i');
          return regex.test(msg.content);
        });

        console.log('Actual mentions after filtering:', actualMentions);

        // Get user profiles and room titles separately
        const userIds = [...new Set(actualMentions.map(msg => msg.user_id))];
        const roomIds = [...new Set(actualMentions.map(msg => msg.room_id))];

        const [profilesResponse, roomsResponse] = await Promise.all([
          supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds),
          supabase.from('debate_rooms').select('id, title').in('id', roomIds)
        ]);

        const mentionsData = actualMentions.map(msg => ({
          id: `mention_${msg.id}`,
          message_id: msg.id,
          mentioned_user_id: user.id,
          mentioned_by_id: msg.user_id,
          room_id: msg.room_id,
          is_read: false, // For now, treat all as unread
          created_at: msg.created_at,
          mentioned_by_profile: profilesResponse.data?.find(p => p.user_id === msg.user_id),
          message_content: msg.content,
          room_title: roomsResponse.data?.find(r => r.id === msg.room_id)?.title || 'Unknown Room'
        }));

        setMentions(mentionsData);
        setUnreadMentions(mentionsData.length);
        console.log('Set mentions:', mentionsData.length);
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
    console.log('Marking mention as read:', mentionId);
    
    // Update both mentions and unread count synchronously  
    setMentions(prev => {
      const updated = prev.map(mention => 
        mention.id === mentionId 
          ? { ...mention, is_read: true }
          : mention
      );
      
      // Count unread mentions and update state
      const unreadCount = updated.filter(m => !m.is_read).length;
      setUnreadMentions(unreadCount);
      console.log('Updated unread mentions count to:', unreadCount);
      
      return updated;
    });
  };

  const markAllMentionsAsRead = async () => {
    console.log('Marking all mentions as read');
    
    setMentions(prev => {
      const updated = prev.map(mention => ({ ...mention, is_read: true }));
      setUnreadMentions(0);
      console.log('Marked all mentions as read');
      return updated;
    });
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

            // Use exact word boundary matching for mentions
            const regex = new RegExp(`@${currentProfile.username}\\b`, 'i');
            return regex.test(messageContent);
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