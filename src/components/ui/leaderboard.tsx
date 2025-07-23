import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

const mockUsers = [
  { name: "Alex Thompson", points: 2847, rank: 1, debates: 45 },
  { name: "Sarah Chen", points: 2743, rank: 2, debates: 42 },
  { name: "Marcus Johnson", points: 2651, rank: 3, debates: 38 },
  { name: "Emma Wilson", points: 2543, rank: 4, debates: 41 },
  { name: "David Kim", points: 2487, rank: 5, debates: 35 }
];

export const Leaderboard = () => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-turf-warning" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-400" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-turf-purple" />
          <span>Top Debaters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockUsers.map((user, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(user.rank)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-r from-turf-purple to-turf-accent text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.debates} debates</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-turf-purple/10 text-turf-purple border-turf-purple/20">
              {user.points.toLocaleString()} pts
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};