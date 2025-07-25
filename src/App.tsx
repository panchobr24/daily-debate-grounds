import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ProfileActivity from "./pages/ProfileActivity";
import About from "./pages/About";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.pathname + location.search}
        classNames="fade-page"
        timeout={400}
      >
        <Routes location={location}>
          <Route path="/" element={<div className="fade-page"><Index /></div>} />
          <Route path="/auth" element={<div className="fade-page"><Auth /></div>} />
          <Route path="/chat/:roomId" element={<div className="fade-page"><Chat /></div>} />
          <Route path="/profile" element={<div className="fade-page"><Profile /></div>} />
          <Route path="/profile/activity" element={<div className="fade-page"><ProfileActivity /></div>} />
          <Route path="/about" element={<div className="fade-page"><About /></div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<div className="fade-page"><NotFound /></div>} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
