import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, Users, Clock, ArrowUp } from "lucide-react";

interface DebateRoomCardProps {
  topic: string;
  participants: number;
  messages: number;
  timeRemaining: string;
  roomNumber: number;
  isActive?: boolean;
  onClick?: () => void;
}

export const DebateRoomCard = ({ 
  topic, 
  participants, 
  messages, 
  timeRemaining, 
  roomNumber,
  isActive = false,
  onClick 
}: DebateRoomCardProps) => {
  return (
    <Card className={`group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      isActive ? 'ring-2 ring-turf-purple shadow-lg' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Room {roomNumber}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <h3 className="font-semibold text-lg leading-tight group-hover:text-turf-purple transition-colors">
          {topic}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {participants}
            </div>
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              {messages}
            </div>
          </div>
          
          <div className="flex items-center">
            <ArrowUp className="h-4 w-4 mr-1 text-turf-success" />
            <span className="text-turf-success font-medium">+24</span>
          </div>
        </div>
        
        <Button 
          onClick={onClick}
          className="w-full bg-gradient-to-r from-turf-purple to-turf-accent hover:opacity-90 transition-opacity"
          size="sm"
        >
          Join Debate
        </Button>
      </CardContent>
    </Card>
  );
};