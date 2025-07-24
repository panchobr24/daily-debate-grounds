import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/ui/header";
import { HeroSection } from "@/components/ui/hero-section";
import { DebateRoomCard } from "@/components/ui/debate-room-card";
import { Leaderboard } from "@/components/ui/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

interface DebateRoom {
  id: string;
  title: string;
  description: string;
  topic: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

const Index = () => {
  const [debateRooms, setDebateRooms] = useState<DebateRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDebateRooms();
  }, []);

  const fetchDebateRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('debate_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDebateRooms(data);
    }
    setLoading(false);
  };

  const formatTimeLeft = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    if (expiryDate < now) {
      return "Expired";
    }
    
    return formatDistanceToNow(expiryDate, { locale: enUS });
  };

  const handleJoinRoom = (roomId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-turf-purple/5">
      <Header />
      
      <HeroSection />
      
      {/* Today's Debate Rooms */}
      <section id="rooms" className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Today's Debate Rooms</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Six carefully curated topics refresh every 24 hours. Join the conversation that interests you most.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turf-purple"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {debateRooms.map((room) => (
                <DebateRoomCard 
                  key={room.id}
                  topic={room.topic}
                  participants={Math.floor(Math.random() * 200) + 50}
                  messages={Math.floor(Math.random() * 500) + 100}
                  timeRemaining={formatTimeLeft(room.expires_at)}
                  roomNumber={parseInt(room.id.slice(-1)) || 1}
                  isActive={room.is_active}
                  onClick={() => handleJoinRoom(room.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-16 bg-card/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-6">Community Leaderboard</h2>
              <p className="text-muted-foreground mb-8">
                Recognition for thoughtful contributors. Points are awarded for quality discussions 
                and constructive debate participation.
              </p>
              
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-turf-purple">1,247</div>
                  <div className="text-sm text-muted-foreground">Active Debaters</div>
                </div>
                <div className="bg-card rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-turf-accent">8,932</div>
                  <div className="text-sm text-muted-foreground">Messages Today</div>
                </div>
                <div className="bg-card rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-turf-success">94%</div>
                  <div className="text-sm text-muted-foreground">Positive Interactions</div>
                </div>
              </div>
            </div>
            
            <div>
              <Leaderboard />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
