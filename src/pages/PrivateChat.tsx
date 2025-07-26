import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface PrivateChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
}

interface PrivateMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  room_id: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface FriendProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function PrivateChat() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<PrivateChatRoom | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!roomId) {
      navigate('/friends');
      return;
    }

    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    fetchRoom();
    fetchMessages();
    subscribeToMessages();
  }, [roomId, user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoom = async () => {
    const { data, error } = await supabase
      .from('private_chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      toast({
        title: "Error loading chat",
        description: "Could not load the private chat.",
        variant: "destructive",
      });
      navigate('/friends');
      return;
    }

    setRoom(data);

    // Get friend's profile
    const friendId = data.user1_id === user?.id ? data.user2_id : data.user1_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .eq('user_id', friendId)
      .single();

    setFriendProfile(profile);
  };

  const fetchMessages = async () => {
    setLoading(true);
    
    const { data: messagesData, error: messagesError } = await supabase
      .from('private_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      toast({
        title: "Error loading messages",
        description: messagesError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profiles for all senders
    const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', senderIds);

    // Combine data
    const messagesWithProfiles = messagesData?.map(message => ({
      ...message,
      sender_profile: profilesData?.find(p => p.user_id === message.sender_id) || null
    })) || [];

    setMessages(messagesWithProfiles);
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('private_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          fetchMessages(); // Refetch to get profile data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    const { data: newMessageData, error } = await supabase
      .from('private_messages')
      .insert({
        content: messageContent,
        room_id: roomId!,
        sender_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      setNewMessage(messageContent); // Restore message if error
    } else if (newMessageData) {
      // Add the new message to the local state immediately
      const newMessageWithProfile: PrivateMessage = {
        ...newMessageData,
        sender_profile: {
          username: profile?.username || user.email || 'User',
          avatar_url: profile?.avatar_url || null
        }
      };
      
      setMessages(prev => [...prev, newMessageWithProfile]);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!room || !friendProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Chat not found</p>
          <Button onClick={() => navigate('/friends')} className="mt-4">
            Back to friends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-turf-purple text-white p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/friends')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={friendProfile.avatar_url || undefined} />
              <AvatarFallback>
                {friendProfile.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{friendProfile.username}</h1>
              <p className="text-turf-purple-light">Private chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Start your conversation with {friendProfile.username}!</p>
              </div>
            ) : (
              messages.map((message) => (
                <Card key={message.id} className={`p-4 ${message.sender_id === user?.id ? 'ml-auto max-w-md' : 'mr-auto max-w-md'}`}>
                  <div className={`flex gap-3 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.sender_profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.sender_id === user?.id ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${message.sender_id === user?.id ? 'justify-end' : ''}`}>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: enUS 
                          })}
                        </span>
                      </div>
                      <p className="text-foreground">{message.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-card border-t p-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}