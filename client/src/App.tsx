import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AudioPlayerProvider, useAudioPlayer } from "@/lib/AudioPlayerContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import Home from "@/pages/Home";
import Music from "@/pages/Music";
import Videos from "@/pages/Videos";
import Devotion from "@/pages/Devotion";
import Prayer from "@/pages/Prayer";
import Support from "@/pages/Support";
import ThankYou from "@/pages/ThankYou";
import AdminLogin from "@/pages/AdminLogin";
import AdminLayout from "@/pages/AdminLayout";
import NotFound from "@/pages/not-found";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/music" component={Music} />
      <Route path="/videos" component={Videos} />
      <Route path="/devotion" component={Devotion} />
      <Route path="/prayer" component={Prayer} />
      <Route path="/support" component={Support} />
      <Route path="/support/thank-you" component={ThankYou} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { currentTrack } = useAudioPlayer();
  const hasPlayer = !!currentTrack;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className={`flex-1 max-w-lg mx-auto w-full ${hasPlayer ? "pb-36" : "pb-20"}`}>
        <PublicRouter />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/:rest*" component={AdminLayout} />
      </Switch>
    );
  }

  return <AppLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AudioPlayerProvider>
            <TooltipProvider>
              <AppRouter />
              <Toaster />
            </TooltipProvider>
          </AudioPlayerProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
