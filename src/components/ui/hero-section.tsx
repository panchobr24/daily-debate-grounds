import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Trophy } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-turf-purple/5" />
      
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-turf-purple to-turf-accent bg-clip-text text-transparent">
              Daily Debates
            </span>
            <br />
            <span className="text-foreground">That Matter</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Join meaningful conversations in 6 daily debate rooms. Each topic runs for 24 hours, 
            encouraging thoughtful discussion over endless scrolling.
          </p>
          

          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="rounded-full bg-gradient-to-r from-turf-purple to-turf-accent p-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">6 Daily Rooms</h3>
              <p className="text-sm text-muted-foreground text-center">
                Fresh topics every 24 hours keep conversations engaging
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="rounded-full bg-gradient-to-r from-turf-purple to-turf-accent p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Meaningful Community</h3>
              <p className="text-sm text-muted-foreground text-center">
                Connect through thoughtful debate, not superficial likes
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="rounded-full bg-gradient-to-r from-turf-purple to-turf-accent p-3">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Light Gamification</h3>
              <p className="text-sm text-muted-foreground text-center">
                Earn points for quality contributions to the discussion
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};