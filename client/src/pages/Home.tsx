import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Music, BookOpen, HandHeart, ChevronRight, Sparkles, Bell, BellOff, X, Play, Crown, Lock, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useAuth } from "@/lib/AuthContext";
import type { DailyVerse, Encouragement, MusicTrack } from "@shared/schema";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, isPushSupported } from "@/lib/pushNotifications";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

export default function Home() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return localStorage.getItem("bp-notif-banner-dismissed") === "true"; } catch { return false; }
  });
  const pushSupported = isPushSupported();

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled);
  }, []);

  const handleTogglePush = async () => {
    if (!pushSupported) {
      toast({ title: t("notificationsNotSupported"), duration: 6000 });
      return;
    }
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const success = await unsubscribeFromPush();
        if (success) {
          setPushEnabled(false);
          toast({ title: t("notificationsDisabled") });
        }
      } else {
        const success = await subscribeToPush(language);
        if (success) {
          setPushEnabled(true);
          toast({ title: t("notificationsEnabled") });
        } else {
          toast({ title: t("notificationsDenied"), variant: "destructive" });
        }
      }
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
    setPushLoading(false);
  };

  const { data: verse, isLoading: verseLoading } = useQuery<DailyVerse>({
    queryKey: ["/api/daily-verse", language],
    queryFn: async () => {
      const res = await fetch(`/api/daily-verse?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch daily verse");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const { data: encouragement, isLoading: encouragementLoading } = useQuery<Encouragement>({
    queryKey: ["/api/encouragement", language],
    queryFn: async () => {
      const res = await fetch(`/api/encouragement?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch encouragement");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const { data: tracks } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music"],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: featuredSong } = useQuery<MusicTrack | null>({
    queryKey: ["/api/music/featured"],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const today = new Date().toLocaleDateString(language === "fr" ? "fr-FR" : language === "ht" ? "fr-HT" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const featuredTrack = featuredSong || tracks?.[0];

  return (
    <div className="flex flex-col min-h-full">

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040] px-5 pt-8 pb-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/3 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <img
              src={logoImage}
              alt="Bénédictions Partagées"
              className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl font-bold text-white leading-tight" data-testid="text-greeting">
                {t("appName")}
              </h1>
              <p className="text-[#D4AF37]/80 text-sm font-medium">{t("tagline")}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTogglePush}
              disabled={pushLoading}
              className="text-white/70 border border-white/15 rounded-full flex-shrink-0 no-default-hover-elevate no-default-active-elevate"
              data-testid="button-home-toggle-notifications"
            >
              {pushEnabled ? (
                <BellOff className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-white/50 text-xs capitalize mb-1">{today}</p>
          <p className="text-white/70 text-sm leading-relaxed" data-testid="text-blessed-greeting">
            {t("missionLine")}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-5">

        <Card className="shadow-lg border-0 overflow-hidden" data-testid="card-daily-verse">
          <CardContent className="p-0">
            <div className="relative px-6 py-6">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/30 rounded-r" />

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.2em]">
                  {t("todaysVerse")}
                </span>
              </div>

              {verseLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                  <Skeleton className="h-6 w-4/6" />
                  <Skeleton className="h-4 w-1/3 mt-4" />
                </div>
              ) : verse ? (
                <div className="space-y-4">
                  <blockquote
                    className="font-serif text-xl text-foreground leading-relaxed italic text-center"
                    data-testid="text-daily-verse"
                  >
                    &laquo; {verse.verse} &raquo;
                  </blockquote>

                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px w-8 bg-[#D4AF37]/40" />
                    <p
                      className="text-center text-[#D4AF37] font-serif font-semibold text-sm"
                      data-testid="text-verse-reference"
                    >
                      {verse.reference}
                    </p>
                    <div className="h-px w-8 bg-[#D4AF37]/40" />
                  </div>
                </div>
              ) : (
                <p className="font-serif text-xl text-foreground italic leading-relaxed text-center">
                  &laquo; For I know the plans I have for you, declares the Lord. &raquo;
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {pushSupported && !pushEnabled && !bannerDismissed && (
          <Card className="shadow-md border-[#D4AF37]/20 overflow-hidden" data-testid="card-notification-banner">
            <CardContent className="p-0">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#D4AF37]/8 to-transparent">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm mb-1" data-testid="text-notification-banner-title">
                    {t("notificationBannerTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t("notificationBannerDesc")}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold"
                    data-testid="button-notification-banner-enable"
                  >
                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                    {t("turnOn")}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 -mt-1 -mr-1"
                  onClick={() => {
                    setBannerDismissed(true);
                    try { localStorage.setItem("bp-notif-banner-dismissed", "true"); } catch {}
                  }}
                  data-testid="button-notification-banner-dismiss"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3" data-testid="section-devotional-preview">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif font-semibold text-xl text-foreground">
              {t("todaysDevotional")}
            </h2>
            <Link href="/devotion" data-testid="link-read-more">
              <Button variant="ghost" size="sm" className="text-[#D4AF37]">
                {t("readMore")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="shadow-md">
            <CardContent className="p-5">
              {verseLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : verse ? (
                <p
                  className="text-muted-foreground leading-relaxed line-clamp-4"
                  data-testid="text-devotional-preview"
                >
                  {verse.devotional}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md overflow-hidden" data-testid="card-prayer-preview">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0A1F44]/8 dark:bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HandHeart className="w-5 h-5 text-[#0A1F44] dark:text-[#D4AF37]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif font-semibold text-lg text-foreground mb-2">
                  {t("prayerInspired")}
                </h2>
                {verseLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : verse ? (
                  <p
                    className="text-muted-foreground leading-relaxed italic line-clamp-3"
                    data-testid="text-prayer-preview"
                  >
                    {verse.prayer}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {featuredTrack && (
          <div className="space-y-3" data-testid="section-featured-worship">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif font-semibold text-xl text-foreground">
                {t("featuredSong")}
              </h2>
              <Link href="/music">
                <Button variant="ghost" size="sm" className="text-[#D4AF37]">
                  {t("exploreAllMusic")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <Card
              className="shadow-md overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => {
                if (featuredTrack.locked) {
                  toast({
                    title: t("earlyAccessOnly"),
                    description: t("earlyAccessDesc"),
                  });
                  return;
                }
                if (tracks && tracks.length > 0) {
                  const trackIndex = tracks.findIndex((tr) => tr.id === featuredTrack.id);
                  if (trackIndex >= 0) {
                    playTrack(tracks[trackIndex], tracks, trackIndex);
                  } else {
                    playTrack(featuredTrack, [featuredTrack], 0);
                  }
                } else {
                  playTrack(featuredTrack, [featuredTrack], 0);
                }
              }}
              data-testid="card-featured-worship"
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-lg bg-cover bg-center shadow-sm"
                      style={{
                        backgroundImage: featuredTrack.albumArt ? `url(${featuredTrack.albumArt})` : undefined,
                        backgroundColor: "hsl(var(--muted))",
                      }}
                    />
                    <div className="absolute inset-0 rounded-lg bg-black/20 flex items-center justify-center">
                      {featuredTrack.locked ? (
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-[#0A1F44]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                          <Play className="w-4 h-4 text-[#0A1F44] ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate" data-testid="text-featured-song-title">
                        {featuredTrack.title}
                      </p>
                      {featuredTrack.isEarlyAccess && (
                        <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-[10px] px-1.5 py-0 no-default-hover-elevate no-default-active-elevate" data-testid="badge-early-access">
                          <Crown className="w-3 h-3 mr-0.5" />
                          {t("earlyAccess")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {featuredTrack.artist}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-[#D4AF37]">
                        {featuredTrack.duration}
                      </p>
                      {featuredTrack.releaseDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid="text-release-date">
                          <Calendar className="w-3 h-3" />
                          {new Date(featuredTrack.releaseDate).toLocaleDateString(
                            language === "fr" ? "fr-FR" : language === "ht" ? "fr-HT" : "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(!user || !user.isPremium) && (
          <Link href={user ? "/pricing" : "/login"}>
            <Card className="shadow-md overflow-hidden hover-elevate active-elevate-2 cursor-pointer" data-testid="card-premium-banner">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-r from-[#0A1F44] to-[#132D5E] dark:from-[#060E22] dark:to-[#0E2040] px-5 py-4">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-[#D4AF37]/10 rounded-full blur-2xl -translate-y-1/3 translate-x-1/4" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-serif font-semibold text-white text-sm">
                          {t("upgradeToPremium") || "Upgrade to Premium"}
                        </p>
                        <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-[10px] px-1.5 py-0">
                          $4.99/mo
                        </Badge>
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed">
                        {t("premiumBannerDesc") || "Unlimited saved verses, early access music & more"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#D4AF37]/70 flex-shrink-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="relative rounded-xl overflow-hidden" data-testid="section-encouragement">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44]/95 to-[#132D5E]/90 dark:from-[#060E22]/98 dark:to-[#0E2040]/92" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/8 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl" />

          <div className="relative px-6 py-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="font-serif font-semibold text-base text-white/90">
                {t("encouragement")}
              </h2>
            </div>

            {encouragementLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
                <Skeleton className="h-3 w-1/3 mt-3 bg-white/10" />
              </div>
            ) : encouragement ? (
              <>
                <p
                  className="text-white/80 leading-relaxed text-base mb-3"
                  data-testid="text-encouragement"
                >
                  {encouragement.text}
                </p>
                <p className="text-[#D4AF37] font-serif font-medium text-sm">
                  — {encouragement.author}
                </p>
              </>
            ) : (
              <p className="text-white/80 leading-relaxed">
                God's love for you is endless. Take heart in knowing that you are never alone on this journey.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 pb-3" data-testid="section-quick-links">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/devotion" data-testid="link-explore-devotion">
              <Card className="hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-[#0A1F44]/8 dark:bg-[#D4AF37]/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#0A1F44] dark:text-[#D4AF37]" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">{t("devotion")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t("exploreDevotion")}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/music" data-testid="link-explore-music">
              <Card className="hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">{t("music")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t("exploreMusic")}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/prayer" data-testid="link-explore-prayer">
              <Card className="hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-[#0A1F44]/8 dark:bg-[#D4AF37]/15 flex items-center justify-center">
                    <HandHeart className="w-5 h-5 text-[#0A1F44] dark:text-[#D4AF37]" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">{t("prayer")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t("explorePrayer")}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/videos" data-testid="link-explore-videos">
              <Card className="hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">{t("videos")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t("exploreVideos")}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="pb-6">
          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed" data-testid="text-scripture-attribution">
            {t("scriptureAttribution")}
          </p>
        </div>
      </div>
    </div>
  );
}
