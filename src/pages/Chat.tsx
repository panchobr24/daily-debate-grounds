import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, ThumbsUp, ThumbsDown, ArrowLeft, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { UserContextMenu } from '@/components/ui/user-context-menu';

interface DebateRoom {
  id: string;
  title: string;
  description: string;
  topic: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
  message_reactions?: {
    reaction_type: string;
    user_id: string;
  }[];
}

interface Profile {
  username: string;
  avatar_url: string | null;
}

export default function Chat() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<DebateRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!roomId) {
      navigate('/');
      return;
    }

    fetchRoom();
    fetchMessages();
    subscribeToMessages();
    subscribeToReactions();
  }, [roomId, user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoom = async () => {
    const { data, error } = await supabase
      .from('debate_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      toast({
        title: "Error loading room",
        description: "Could not load the debate room.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setRoom(data);
  };

  const fetchMessages = async () => {
    setLoading(true);
    
    // Fetch messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
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

    // Fetch profiles for all users
    const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    // Fetch reactions
    const messageIds = messagesData?.map(m => m.id) || [];
    const { data: reactionsData } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds);

    // Combine data
    const messagesWithProfiles = messagesData?.map(message => ({
      ...message,
      profiles: profilesData?.find(p => p.user_id === message.user_id) || null,
      message_reactions: reactionsData?.filter(r => r.message_id === message.id) || []
    })) || [];

    setMessages(messagesWithProfiles);
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
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

  const subscribeToReactions = () => {
    const channel = supabase
      .channel('reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        () => {
          fetchMessages(); // Refetch to update reactions
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
    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage.trim(),
        room_id: roomId,
        user_id: user.id
      });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleReaction = async (messageId: string, reactionType: 'upvote' | 'downvote') => {
    if (!user) return;

    // Check if user already reacted to this message
    const existingReaction = messages
      .find(m => m.id === messageId)
      ?.message_reactions
      .find(r => r.user_id === user.id);

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
      } else {
        // Update reaction
        await supabase
          .from('message_reactions')
          .update({ reaction_type: reactionType })
          .eq('message_id', messageId)
          .eq('user_id', user.id);
      }
    } else {
      // Add new reaction
      await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType
        });
    }
  };

  const getReactionCount = (message: Message, type: 'upvote' | 'downvote') => {
    return message.message_reactions?.filter(r => r.reaction_type === type).length || 0;
  };

  const hasUserReacted = (message: Message, type: 'upvote' | 'downvote') => {
    return message.message_reactions?.some(r => r.reaction_type === type && r.user_id === user?.id) || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
        <p className="text-lg">Room not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Back to home
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
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{room.title}</h1>
            <p className="text-turf-purple-light">{room.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>{messages.length > 0 ? new Set(messages.map(m => m.user_id)).size : 0} participants</span>
          </div>
        </div>
      </div>

      {/* Topic */}
      <div className="bg-card border-b p-4">
        <div className="container mx-auto">
          <Badge variant="secondary" className="bg-turf-accent/10 text-turf-accent border-turf-accent/20">
            Debate topic
          </Badge>
          <p className="mt-2 text-lg font-medium">{room.topic}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Be the first to start the debate!</p>
              </div>
            ) : (
              messages.map((message) => (
                <Card key={message.id} className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={message.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserContextMenu 
                          userId={message.user_id}
                          username={message.profiles?.username || 'User'}
                          avatarUrl={message.profiles?.avatar_url}
                        >
                          <span className="font-semibold cursor-pointer hover:text-turf-purple transition-colors">
                            {message.profiles?.username || 'User'}
                          </span>
                        </UserContextMenu>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: enUS 
                          })}
                        </span>
                      </div>
                      <p className="text-foreground mb-3">{message.content}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(message.id, 'upvote')}
                          className={`h-8 px-2 ${hasUserReacted(message, 'upvote') ? 'bg-turf-success/20 text-turf-success' : ''}`}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {getReactionCount(message, 'upvote')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(message.id, 'downvote')}
                          className={`h-8 px-2 ${hasUserReacted(message, 'downvote') ? 'bg-destructive/20 text-destructive' : ''}`}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {getReactionCount(message, 'downvote')}
                        </Button>
                      </div>
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