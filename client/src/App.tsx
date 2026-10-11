import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AudioPlayerProvider, useAudioPlayer } from "@/lib/AudioPlayerContext";
import { getSunoEmbedUrl } from "@/lib/sunoEmbed";
import { AuthProvider } from "@/lib/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

const Music = lazy(() => import("@/pages/Music"));
const Videos = lazy(() => import("@/pages/Videos"));
const Devotion = lazy(() => import("@/pages/Devotion"));
const Prayer = lazy(() => import("@/pages/Prayer"));
const Support = lazy(() => import("@/pages/Support"));
const ThankYou = lazy(() => import("@/pages/ThankYou"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SavedVerses = lazy(() => import("@/pages/SavedVerses"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/AdminLayout"));
const SharedPlaylist = lazy(() => import("@/pages/SharedPlaylist"));
const About = lazy(() => import("@/pages/About"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const DeleteAccount = lazy(() => import("@/pages/DeleteAccount"));

function LazyFallback() {
  return <div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
}

const pageTitles: Record<string, string> = {
  "/": "Bénédictions Partagées — Gospel Worship, Daily Devotion & Prayer",
  "/music": "Gospel Music Library — Bénédictions Partagées",
  "/videos": "Video Teachings — Bénédictions Partagées",
  "/devotion": "Today's Devotion — Bénédictions Partagées",
  "/prayer": "Prayer Wall — Bénédictions Partagées",
  "/support": "Support Our Ministry — Bénédictions Partagées",
  "/about": "About Us — Bénédictions Partagées",
  "/privacy": "Privacy Policy — Bénédictions Partagées",
  "/terms": "Terms of Use — Bénédictions Partagées",
  "/login": "Sign In — Bénédictions Partagées",
  "/register": "Create Account — Bénédictions Partagées",
  "/pricing": "Pricing — Bénédictions Partagées",
  "/dashboard": "Dashboard — Bénédictions Partagées",
  "/saved-verses": "Saved Verses — Bénédictions Partagées",
};

function PageTitle() {
  const [location] = useLocation();
  useEffect(() => {
    const base = location.split("?")[0].replace(/\/$/, "") || "/";
    document.title = pageTitles[base] || pageTitles["/"];
  }, [location]);
  return null;
}

function PublicRouter() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <PageTitle />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/music" component={Music} />
        <Route path="/listen">
          <Redirect to="/music" />
        </Route>
        <Route path="/videos" component={Videos} />
        <Route path="/devotion" component={Devotion} />
        <Route path="/prayer" component={Prayer} />
        <Route path="/support" component={Support} />
        <Route path="/support/thank-you" component={ThankYou} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/saved-verses" component={SavedVerses} />
        <Route path="/playlist/:id" component={SharedPlaylist} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfUse} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppLayout() {
  const { currentTrack } = useAudioPlayer();
  const hasPlayer = !!currentTrack;
  const hasSunoPlayer = !!getSunoEmbedUrl(currentTrack?.audioUrl);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <Header />
      <InstallAppBanner />
      <main className={`flex-1 w-full ${hasSunoPlayer ? "pb-44 sm:pb-52" : hasPlayer ? "pb-36 md:pb-20" : "pb-20 md:pb-0"} md:max-w-none max-w-lg mx-auto`}>
        <PublicRouter />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" nest>
          <AdminLayout />
        </Route>
        <Route>
          <AppLayout />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
