import { Button } from "@/components/ui/button";
import turfLogo from "@/assets/turf-logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRef } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={turfLogo} alt="Turf" className="h-8 w-8" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-turf-purple to-turf-accent bg-clip-text text-transparent">
            Turf
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => window.location.hash = '#rooms'}
            className="text-sm font-medium hover:text-turf-purple transition-colors"
          >
            Debate Rooms
          </button>
          <button 
            onClick={() => window.location.hash = '#leaderboard'}
            className="text-sm font-medium hover:text-turf-purple transition-colors"
          >
            Leaderboard
          </button>
          <button 
            onClick={() => navigate("/about")}
            className="text-sm font-medium hover:text-turf-purple transition-colors"
          >
            About
          </button>
        </nav>

        <div className="flex items-center space-x-3">
          {!user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-turf-purple to-turf-accent hover:opacity-90 transition-opacity"
                onClick={() => navigate("/auth")}
              >
                Join Debate
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={menuTriggerRef}
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium max-w-[120px] truncate">
                    {profile?.username || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{profile?.username || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/activity")}>My Activity</DropdownMenuItem>
                <DropdownMenuItem disabled>Score: coming soon</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};