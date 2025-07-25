import { Header } from "@/components/ui/header";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              <span className="bg-gradient-to-r from-turf-purple to-turf-accent bg-clip-text text-transparent">
                About Our Mission
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bringing people closer together in our digital age through meaningful conversations
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-foreground mb-6">
                  In today's digital landscape, we find ourselves more connected than ever before, yet somehow feeling more distant from one another. Social media feeds scroll endlessly, notifications constantly demand our attention, but genuine human connection feels increasingly rare.
                </p>
                
                <p className="text-lg leading-relaxed text-foreground mb-6">
                  This platform was born from a simple belief: <strong>meaningful discussion can bridge the gap that technology has created between us</strong>. Instead of superficial likes and fleeting comments, we've created a space for thoughtful debate and genuine dialogue.
                </p>

                <p className="text-lg leading-relaxed text-foreground">
                  Every day, we present six carefully curated topics that matter – issues that shape our world and our lives. Each discussion lasts exactly 24 hours, encouraging quality over quantity. No endless scrolling, no algorithm-driven echo chambers – just real people engaging in real conversations about real issues.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-gradient-to-r from-turf-purple to-turf-accent p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Genuine Connection</h3>
                <p className="text-muted-foreground">
                  Foster real relationships through thoughtful conversation, not superficial interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-gradient-to-r from-turf-purple to-turf-accent p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Quality Discussions</h3>
                <p className="text-muted-foreground">
                  24-hour topic cycles ensure fresh, focused conversations without endless scrolling
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-gradient-to-r from-turf-purple to-turf-accent p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Healthy Community</h3>
                <p className="text-muted-foreground">
                  Build understanding across different perspectives in a respectful environment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;