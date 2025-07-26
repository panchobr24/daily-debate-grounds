import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
  is_read: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get private messages where user is the receiver
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .neq('sender_id', user.id)
        .is('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (messages) {
        // Get profiles for all senders
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', senderIds);

        const notificationsWithProfiles = messages.map(message => ({
          id: message.id,
          room_id: message.room_id,
          sender_id: message.sender_id,
          content: message.content,
          created_at: message.created_at,
          sender_profile: profiles?.find(p => p.user_id === message.sender_id) || null,
          is_read: message.is_read || false
        }));

        setNotifications(notificationsWithProfiles);
        setUnreadCount(notificationsWithProfiles.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Update in database
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('id', notificationId);

    // Update local state
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    // Update in database
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .neq('sender_id', user?.id)
      .is('is_read', false);

    // Update local state
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, is_read: true }))
    );
    setUnreadCount(0);
  };

  const subscribeToNewMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel('private_messages_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `sender_id.neq.${user.id}`
        },
        async (payload) => {
          // Get the sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .single();

          const newNotification: Notification = {
            id: payload.new.id,
            room_id: payload.new.room_id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            sender_profile: profile,
            is_read: false
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast({
            title: `New message from ${profile?.username || 'Friend'}`,
            description: payload.new.content.length > 50 
              ? `${payload.new.content.substring(0, 50)}...` 
              : payload.new.content,
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
      fetchNotifications();
      const unsubscribe = subscribeToNewMessages();
      return unsubscribe;
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}; 