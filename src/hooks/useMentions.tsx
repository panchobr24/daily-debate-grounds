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
              const { data: mentionsData, error: mentionsError } = await supabase
          .from('mentions')
          .select('*')
          .eq('mentioned_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (mentionsError) {
          console.error('Error fetching mentions:', mentionsError);
          return;
        }

              console.log('Found mentions:', mentionsData);
        
        if (mentionsData) {
          // Get profiles for mentioned_by users
          const mentionedByIds = [...new Set(mentionsData.map(m => m.mentioned_by_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .in('user_id', mentionedByIds);

          // Get message contents
          const messageIds = [...new Set(mentionsData.map(m => m.message_id))];
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content')
            .in('id', messageIds);

          // Get room titles
          const roomIds = [...new Set(mentionsData.map(m => m.room_id))];
          const { data: rooms } = await supabase
            .from('debate_rooms')
            .select('id, title')
            .in('id', roomIds);

          const mentionsWithDetails = mentionsData.map(mention => ({
            ...mention,
            mentioned_by_profile: profiles?.find(p => p.user_id === mention.mentioned_by_id) || null,
            message_content: messages?.find(m => m.id === mention.message_id)?.content || '',
            room_title: rooms?.find(r => r.id === mention.room_id)?.title || ''
          }));

          setMentions(mentionsWithDetails);
          setUnreadMentions(mentionsWithDetails.length); // Assume all are unread for now
        }
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMentionAsRead = async (mentionId: string) => {
    await supabase
      .from('mentions')
      .update({ is_read: true })
      .eq('id', mentionId);

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
    await supabase
      .from('mentions')
      .update({ is_read: true })
      .eq('mentioned_user_id', user?.id)
      .eq('is_read', false);

    setMentions(prev => 
      prev.map(mention => ({ ...mention, is_read: true }))
    );
    setUnreadMentions(0);
  };

  const createMentions = async (messageId: string, roomId: string, mentionedUsernames: string[]) => {
    if (!user || mentionedUsernames.length === 0) return;

    try {
      // Get user IDs for mentioned usernames
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('username', mentionedUsernames);

      if (profiles && profiles.length > 0) {
        const mentionsToInsert = profiles.map(profile => ({
          message_id: messageId,
          mentioned_user_id: profile.user_id,
          mentioned_by_id: user.id,
          room_id: roomId
        }));

        const { error } = await supabase
          .from('mentions')
          .insert(mentionsToInsert);

        if (error) {
          console.error('Error creating mentions:', error);
        } else {
          // Show toast for each mention
          profiles.forEach(profile => {
            toast({
              title: `Mentioned ${profile.username}`,
              description: `You mentioned ${profile.username} in a debate`,
            });
          });
        }
      }
    } catch (error) {
      console.error('Error creating mentions:', error);
    }
  };

  const subscribeToNewMentions = () => {
    if (!user) return;

    const channel = supabase
      .channel('mentions_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentions',
          filter: `mentioned_user_id=eq.${user.id}`
        },
        async (payload) => {
          // Get the mentioner's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', payload.new.mentioned_by_id)
            .single();

          // Get the message content
          const { data: message } = await supabase
            .from('messages')
            .select('content')
            .eq('id', payload.new.message_id)
            .single();

          // Get the room title
          const { data: room } = await supabase
            .from('debate_rooms')
            .select('title')
            .eq('id', payload.new.room_id)
            .single();

          const newMention: Mention = {
            id: payload.new.id,
            message_id: payload.new.message_id,
            mentioned_user_id: payload.new.mentioned_user_id,
            mentioned_by_id: payload.new.mentioned_by_id,
            room_id: payload.new.room_id,
            is_read: payload.new.is_read,
            created_at: payload.new.created_at,
            mentioned_by_profile: profile,
            message_content: message?.content || '',
            room_title: room?.title || ''
          };

          setMentions(prev => [newMention, ...prev.slice(0, 49)]);
          setUnreadMentions(prev => prev + 1);

          // Show toast notification
          toast({
            title: `You were mentioned by ${profile?.username || 'Someone'}`,
            description: message?.content?.length > 50 
              ? `${message.content.substring(0, 50)}...` 
              : message?.content || '',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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