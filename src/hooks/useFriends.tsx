import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: {
    user_id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend_profile:profiles!friendships_user1_id_fkey(*),
          friend_profile2:profiles!friendships_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      // Transform the data to get the friend's profile
      const transformedFriends = data?.map(friendship => ({
        ...friendship,
        friend_profile: friendship.user1_id === user.id 
          ? friendship.friend_profile2 
          : friendship.friend_profile
      })) || [];

      setFriends(transformedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user) return;
    
    try {
      // Get pending requests sent to me
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester_profile:profiles!friend_requests_requester_id_fkey(*)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          receiver_id: receiverId
        });

      if (error) throw error;
      
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('accept_friend_request', {
        request_id: requestId
      });

      if (error) throw error;
      
      toast({
        title: "Friend request accepted!",
        description: "You are now friends!",
      });
      
      // Refresh data
      fetchFriends();
      fetchFriendRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      
      fetchFriendRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (!user || !query.trim()) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  return {
    friends,
    friendRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    refreshFriends: fetchFriends,
    refreshFriendRequests: fetchFriendRequests
  };
};