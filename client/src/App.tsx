import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AudioPlayerProvider, useAudioPlayer } from "@/lib/AudioPlayerContext";
import { AuthProvider } from "@/lib/AuthContext";
import { Header } from "@/components/Header";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import Home from "@/pages/Home";
import Music from "@/pages/Music";
import Videos from "@/pages/Videos";
import Devotion from "@/pages/Devotion";
import Prayer from "@/pages/Prayer";
import Support from "@/pages/Support";
import ThankYou from "@/pages/ThankYou";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import SavedVerses from "@/pages/SavedVerses";
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
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/saved-verses" component={SavedVerses} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { currentTrack } = useAudioPlayer();
  const hasPlayer = !!currentTrack;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <Header />
      <main className={`flex-1 w-full ${hasPlayer ? "pb-36 md:pb-20" : "pb-20 md:pb-0"} md:max-w-none max-w-lg mx-auto`}>
        <PublicRouter />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" nest>
        <AdminLayout />
      </Route>
      <Route>
        <AppLayout />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AudioPlayerProvider>
              <TooltipProvider>
                <AppRouter />
                <Toaster />
              </TooltipProvider>
            </AudioPlayerProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
