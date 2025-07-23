import { Header } from "@/components/ui/header";
import { HeroSection } from "@/components/ui/hero-section";
import { DebateRoomCard } from "@/components/ui/debate-room-card";
import { Leaderboard } from "@/components/ui/leaderboard";

const mockTopics = [
  {
    topic: "Should social media platforms be held responsible for mental health impacts?",
    participants: 24,
    messages: 127,
    timeRemaining: "18h 42m",
    roomNumber: 1,
    isActive: true
  },
  {
    topic: "Is remote work the future or are we losing essential human connections?",
    participants: 31,
    messages: 203,
    timeRemaining: "18h 42m",
    roomNumber: 2
  },
  {
    topic: "Should governments regulate AI development more strictly?",
    participants: 19,
    messages: 89,
    timeRemaining: "18h 42m",
    roomNumber: 3
  },
  {
    topic: "Is the four-day work week realistic for all industries?",
    participants: 27,
    messages: 156,
    timeRemaining: "18h 42m",
    roomNumber: 4
  },
  {
    topic: "Should cryptocurrency replace traditional banking systems?",
    participants: 15,
    messages: 67,
    timeRemaining: "18h 42m",
    roomNumber: 5
  },
  {
    topic: "Is climate activism doing more harm than good to environmental causes?",
    participants: 33,
    messages: 241,
    timeRemaining: "18h 42m",
    roomNumber: 6
  }
];

const Index = () => {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {mockTopics.map((room, index) => (
              <DebateRoomCard key={index} {...room} />
            ))}
          </div>
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
