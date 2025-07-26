import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageCircle, User } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserContextMenuProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}

export function UserContextMenu({ userId, username, avatarUrl, children }: UserContextMenuProps) {
  const { user } = useAuth();
  const { sendFriendRequest, friends } = useFriends();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFriend, setIsFriend] = useState(false);

  // Check if user is already a friend
  const checkIfFriend = () => {
    if (!user) return false;
    return friends.some(friend => 
      friend.friend_profile?.user_id === userId
    );
  };

  const handleSendFriendRequest = async () => {
    if (!user) return;
    
    if (user.id === userId) {
      toast({
        title: "Cannot add yourself",
        description: "You cannot send a friend request to yourself.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendFriendRequest(userId);
      toast({
        title: "Friend request sent!",
        description: `Friend request sent to ${username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleStartPrivateChat = async () => {
    if (!user) return;
    
    try {
      // Check if private chat room already exists
      const { data: existingRoom } = await supabase
        .from('private_chat_rooms')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
        .single();

      if (existingRoom) {
        navigate(`/private-chat/${existingRoom.id}`);
        return;
      }

      // Create new private chat room
      const { data: newRoom, error } = await supabase
        .from('private_chat_rooms')
        .insert({
          user1_id: user.id < userId ? user.id : userId,
          user2_id: user.id < userId ? userId : user.id
        })
        .select('id')
        .single();

      if (error) throw error;
      
      navigate(`/private-chat/${newRoom.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start private chat",
        variant: "destructive",
      });
    }
  };

  const isAlreadyFriend = checkIfFriend();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <div className="flex items-center gap-3 p-2 border-b">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>
              {username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{username}</p>
            <p className="text-xs text-muted-foreground">User</p>
          </div>
        </div>
        
        {user && user.id !== userId && (
          <>
            {!isAlreadyFriend ? (
              <ContextMenuItem onClick={handleSendFriendRequest}>
                <UserPlus className="mr-2 h-4 w-4" />
                Send Friend Request
              </ContextMenuItem>
            ) : (
              <ContextMenuItem onClick={handleStartPrivateChat}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Private Chat
              </ContextMenuItem>
            )}
          </>
        )}
        
        <ContextMenuItem>
          <User className="mr-2 h-4 w-4" />
          View Profile
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 