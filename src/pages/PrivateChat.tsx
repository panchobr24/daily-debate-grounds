import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PrivateMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_profile?: {
    username: string;
    avatar_url: string | null;
  };
  user2_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function PrivateChat() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoom = async () => {
    if (!roomId || !user) return;

    try {
      const { data, error } = await supabase
        .from('private_chat_rooms')
        .select(`
          *,
          user1_profile:profiles!private_chat_rooms_user1_id_fkey(*),
          user2_profile:profiles!private_chat_rooms_user2_id_fkey(*)
        `)
        .eq('id', roomId)
        .single();

      if (error || !data) {
        toast({
          title: "Chat room not found",
          description: "This chat room doesn't exist or you don't have access to it.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Check if user has access to this room
      if (data.user1_id !== user.id && data.user2_id !== user.id) {
        toast({
          title: "Access denied",
          description: "You don't have access to this chat room.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
      toast({
        title: "Error",
        description: "Failed to load chat room.",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey(username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    fetchMessages();
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('private-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch the message with profile data
          const { data, error } = await supabase
            .from('private_messages')
            .select(`
              *,
              sender_profile:profiles!private_messages_sender_id_fkey(username, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background flex items-center justify-center">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background flex items-center justify-center">
        <div className="text-white">Chat room not found</div>
      </div>
    );
  }

  const otherUser = room.user1_id === user?.id ? room.user2_profile : room.user1_profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        <Card className="flex-1 flex flex-col bg-card/95 backdrop-blur-sm border-turf-purple/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-turf-purple hover:bg-turf-purple/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarImage src={otherUser?.avatar_url || undefined} />
                <AvatarFallback>
                  {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-turf-purple">
                Chat with {otherUser?.username}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender_id !== user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.sender_profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-turf-purple text-white rounded-br-none'
                        : 'bg-muted rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user?.id 
                        ? 'text-white/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.sender_id === user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.sender_profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                  className="bg-turf-purple hover:bg-turf-purple/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}