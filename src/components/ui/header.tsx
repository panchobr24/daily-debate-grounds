import { Button } from "@/components/ui/button";
import turfLogo from "@/assets/turf-logo.png";

export const Header = () => {
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
          <a href="#rooms" className="text-sm font-medium hover:text-turf-purple transition-colors">
            Debate Rooms
          </a>
          <a href="#leaderboard" className="text-sm font-medium hover:text-turf-purple transition-colors">
            Leaderboard
          </a>
          <a href="#about" className="text-sm font-medium hover:text-turf-purple transition-colors">
            About
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Button className="bg-gradient-to-r from-turf-purple to-turf-accent hover:opacity-90 transition-opacity">
            Join Debate
          </Button>
        </div>
      </div>
    </header>
  );
};