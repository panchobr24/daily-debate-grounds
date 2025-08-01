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

  // Get deleted notification IDs from localStorage
  const getDeletedNotificationIds = (): Set<string> => {
    if (!user) return new Set();
    const key = `deleted_notifications_${user.id}`;
    const deleted = localStorage.getItem(key);
    return deleted ? new Set(JSON.parse(deleted)) : new Set();
  };

  // Save deleted notification IDs to localStorage
  const saveDeletedNotificationIds = (deletedIds: Set<string>) => {
    if (!user) return;
    const key = `deleted_notifications_${user.id}`;
    localStorage.setItem(key, JSON.stringify([...deletedIds]));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Fetching notifications for user:', user.id);
      
      // Get deleted notification IDs
      const deletedIds = getDeletedNotificationIds();
      
      // Get private messages where user is the receiver (not sender)
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Increased limit to get more messages

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log('Found messages:', messages);

      if (messages) {
        // Filter out deleted notifications
        const filteredMessages = messages.filter(message => !deletedIds.has(message.id));
        
        // Get profiles for all senders
        const senderIds = [...new Set(filteredMessages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', senderIds);

        const notificationsWithProfiles = filteredMessages.map(message => ({
          id: message.id,
          room_id: message.room_id,
          sender_id: message.sender_id,
          content: message.content,
          created_at: message.created_at,
          sender_profile: profiles?.find(p => p.user_id === message.sender_id) || null,
          is_read: false
        }));

        setNotifications(notificationsWithProfiles);
        // Only count actual new notifications, not all messages
        const newCount = notificationsWithProfiles.length;
        setUnreadCount(newCount);
        console.log('Set unread count to:', newCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    
    // Add to deleted notifications in localStorage
    const deletedIds = getDeletedNotificationIds();
    deletedIds.add(notificationId);
    saveDeletedNotificationIds(deletedIds);
    
    // Update both notifications and unread count in a single state update
    setNotifications(prev => {
      const filtered = prev.filter(notification => notification.id !== notificationId);
      console.log('Removed notification, remaining count:', filtered.length);
      
      // Update unread count synchronously
      setUnreadCount(filtered.length);
      console.log('Updated unread count to:', filtered.length);
      
      return filtered;
    });
  };

  const markAllAsRead = async () => {
    console.log('Marking all notifications as read');
    
    // Add all current notification IDs to deleted set
    const currentNotificationIds = notifications.map(n => n.id);
    const deletedIds = getDeletedNotificationIds();
    currentNotificationIds.forEach(id => deletedIds.add(id));
    saveDeletedNotificationIds(deletedIds);
    
    // Clear all notifications and unread count synchronously
    setNotifications([]);
    setUnreadCount(0);
    console.log('Marked all as read, unread count set to 0');
  };

  const deleteAllNotifications = async () => {
    console.log('Deleting all notifications');
    
    if (!user) return;
    
    try {
      // Get current notification IDs
      const currentNotificationIds = notifications.map(n => n.id);
      
      // Add all current notification IDs to deleted set
      const deletedIds = getDeletedNotificationIds();
      currentNotificationIds.forEach(id => deletedIds.add(id));
      
      // Save to localStorage
      saveDeletedNotificationIds(deletedIds);
      
      // Clear all notifications and unread count synchronously
      setNotifications([]);
      setUnreadCount(0);
      console.log('Deleted all notifications, unread count set to 0');
      
      toast({
        title: "Success",
        description: "All notifications deleted",
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
    }
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
    markAllAsRead,
    deleteAllNotifications
  };
};