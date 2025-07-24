import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  room_id: string;
  room?: {
    title: string;
    topic: string;
    is_active: boolean;
  };
}

interface DebateParticipation {
  room_id: string;
  room: {
    id: string;
    title: string;
    topic: string;
    is_active: boolean;
    expires_at: string;
  };
  message_count: number;
  last_message_at: string;
}

export default function ProfileActivity() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDebates, setCurrentDebates] = useState<DebateParticipation[]>([]);
  const [pastDebates, setPastDebates] = useState<DebateParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserActivity();
  }, [user, navigate]);

  const fetchUserActivity = async () => {
    setLoading(true);
    
    // Fetch user messages with room info
    const { data: messagesData } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        room_id,
        debate_rooms:room_id (
          title,
          topic,
          is_active
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesData) {
      setMessages(messagesData.map(msg => ({
        ...msg,
        room: msg.debate_rooms
      })));
    }

    // Fetch debate participation summary
    const { data: participationData } = await supabase
      .from('messages')
      .select(`
        room_id,
        created_at,
        debate_rooms:room_id (
          id,
          title,
          topic,
          is_active,
          expires_at
        )
      `)
      .eq('user_id', user?.id);

    if (participationData) {
      // Group by room and calculate stats
      const roomStats = participationData.reduce((acc, msg) => {
        const roomId = msg.room_id;
        if (!acc[roomId]) {
          acc[roomId] = {
            room_id: roomId,
            room: msg.debate_rooms,
            message_count: 0,
            last_message_at: msg.created_at
          };
        }
        acc[roomId].message_count++;
        if (new Date(msg.created_at) > new Date(acc[roomId].last_message_at)) {
          acc[roomId].last_message_at = msg.created_at;
        }
        return acc;
      }, {} as Record<string, DebateParticipation>);

      const participation = Object.values(roomStats);
      
      // Separate current and past debates
      const current = participation.filter(p => p.room.is_active);
      const past = participation.filter(p => !p.room.is_active);
      
      setCurrentDebates(current);
      setPastDebates(past);
    }

    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-turf-purple/5 py-8">
      <div className="container max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                {profile.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">My Activity</h1>
              <p className="text-muted-foreground">{profile.username}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Debates ({currentDebates.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Past Debates ({pastDebates.length})
            </TabsTrigger>
            <TabsTrigger value="messages">Recent Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple"></div>
              </div>
            ) : currentDebates.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  You're not currently participating in any debates. 
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/#rooms")}
                    className="ml-1 p-0 h-auto text-turf-purple"
                  >
                    Join one now!
                  </Button>
                </CardContent>
              </Card>
            ) : (
              currentDebates.map((debate) => (
                <Card key={debate.room_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-lg">{debate.room.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{debate.room.topic}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{debate.message_count} messages</span>
                          <span>Last activity: {formatDistanceToNow(new Date(debate.last_message_at))} ago</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/chat/${debate.room_id}`)}
                        className="bg-gradient-to-r from-turf-purple to-turf-accent hover:opacity-90"
                      >
                        Continue Debate
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple"></div>
              </div>
            ) : pastDebates.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No past debate participation found.
                </CardContent>
              </Card>
            ) : (
              pastDebates.map((debate) => (
                <Card key={debate.room_id} className="opacity-80">
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{debate.room.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{debate.room.topic}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{debate.message_count} messages</span>
                        <span>Last activity: {formatDistanceToNow(new Date(debate.last_message_at))} ago</span>
                        <Badge variant="outline">Ended</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple"></div>
              </div>
            ) : messages.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No messages found. Start participating in debates to see your activity here!
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-muted-foreground">
                          {message.room?.title} • {formatDistanceToNow(new Date(message.created_at))} ago
                        </div>
                        {message.room?.is_active && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{message.room?.topic}</p>
                      <p className="mt-2">{message.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}