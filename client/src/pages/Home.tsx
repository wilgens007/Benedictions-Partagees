import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Music, BookOpen, HandHeart, ChevronRight, Sparkles, Bell, BellOff,
  Play, Crown, Lock, Calendar, Heart, Headphones, BookMarked, Clock,
  ArrowRight, Quote, Users, Star, Check
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useAuth } from "@/lib/AuthContext";
import type { DailyVerse, Encouragement, MusicTrack, Testimony } from "@shared/schema";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, isPushSupported } from "@/lib/pushNotifications";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

export default function Home() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
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

  const { data: encouragement } = useQuery<Encouragement>({
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

  const { data: prayerRequests } = useQuery<any[]>({
    queryKey: ["/api/prayer-requests"],
    staleTime: 60 * 1000,
  });

  const { data: testimoniesData } = useQuery<Testimony[]>({
    queryKey: ["/api/testimonies"],
    staleTime: 60 * 1000,
  });

  const featuredTrack = featuredSong || tracks?.[0];
  const displayTracks = tracks?.filter(tr => !tr.locked)?.slice(0, 4) || [];
  const displayPrayers = prayerRequests?.slice(0, 3) || [];
  const displayTestimonies = testimoniesData?.slice(0, 2) || [];

  return (
    <div className="flex flex-col min-h-full">

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040]"
        data-testid="section-hero"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/3 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 pt-10 pb-14 md:pt-16 md:pb-20 md:px-8">
          <div className="md:flex md:items-center md:gap-12">
            <div className="md:flex-1 md:max-w-xl">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <img
                  src={logoImage}
                  alt="Bénédictions Partagées"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg"
                />
                <div>
                  <p className="text-[#D4AF37]/80 text-xs font-semibold uppercase tracking-widest">{t("tagline")}</p>
                </div>
              </div>

              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4" data-testid="text-hero-headline">
                {t("heroHeadline")}
              </h1>
              <p className="text-white/60 text-base md:text-lg leading-relaxed mb-8 max-w-lg" data-testid="text-hero-subtext">
                {t("heroSubtext")}
              </p>

              <div className="flex items-center gap-3 flex-wrap mb-8">
                <Link href="/music">
                  <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold" data-testid="button-hero-listen">
                    <Headphones className="w-4 h-4 mr-2" />
                    {t("startListening")}
                  </Button>
                </Link>
                <Link href="/prayer">
                  <Button variant="outline" className="text-white border-white/20 backdrop-blur-sm bg-white/5" data-testid="button-hero-prayer">
                    <HandHeart className="w-4 h-4 mr-2" />
                    {t("submitAPrayer")}
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-white/40 text-sm">
                <div className="text-center">
                  <div className="text-[#D4AF37] font-bold text-xl">{t("stat365")}</div>
                  <div className="text-xs">{t("statDailyVerse")}</div>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="text-center">
                  <div className="text-[#D4AF37] font-bold text-xl">{t("stat247")}</div>
                  <div className="text-xs">{t("statWorship")}</div>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="text-center">
                  <div className="text-[#D4AF37] font-bold text-xl">{t("statAlways")}</div>
                  <div className="text-xs">{t("statPrayer")}</div>
                </div>
              </div>
            </div>

            <div className="hidden md:block md:flex-1 md:max-w-sm">
              {verse && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.15em]">{t("todaysVerse")}</span>
                  </div>
                  <blockquote className="font-serif text-lg text-white/90 leading-relaxed italic mb-4">
                    &laquo; {verse.verse} &raquo;
                  </blockquote>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-[#D4AF37]/30" />
                    <p className="text-[#D4AF37] font-serif font-medium text-sm">{verse.reference}</p>
                    <div className="h-px flex-1 bg-[#D4AF37]/30" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TODAY'S BLESSING — 3 Cards ═══════════════ */}
      <section className="px-5 md:px-8 -mt-6 relative z-10 max-w-5xl mx-auto w-full" data-testid="section-todays-blessing">
        <div className="mb-6 md:hidden">
          <h2 className="font-serif font-semibold text-xl text-foreground">{t("todaysBlessing")}</h2>
          <p className="text-sm text-muted-foreground">{t("todaysBlessingDesc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Verse Card */}
          <Card className="shadow-lg border-0 overflow-hidden" data-testid="card-daily-verse">
            <CardContent className="p-0">
              <div className="relative px-5 py-5">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/30 rounded-r" />
                <div className="flex items-center gap-2 mb-3">
                  <BookMarked className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.15em]">{t("dailyVerse")}</span>
                </div>
                {verseLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-4 w-1/3 mt-3" />
                  </div>
                ) : verse ? (
                  <>
                    <blockquote className="font-serif text-base text-foreground leading-relaxed italic mb-3 line-clamp-4" data-testid="text-daily-verse">
                      &laquo; {verse.verse} &raquo;
                    </blockquote>
                    <p className="text-[#D4AF37] font-serif font-medium text-sm mb-3" data-testid="text-verse-reference">
                      {verse.reference}
                    </p>
                    <Link href="/devotion">
                      <Button variant="ghost" size="sm" className="text-[#D4AF37] p-0 h-auto" data-testid="link-read-devotion">
                        {t("readMore")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="font-serif text-base text-foreground italic">&laquo; For I know the plans I have for you... &raquo;</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prayer of the Day Card */}
          <Card className="shadow-lg border-0 overflow-hidden" data-testid="card-prayer-of-day">
            <CardContent className="p-0">
              <div className="relative px-5 py-5">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0A1F44] to-[#0A1F44]/30 dark:from-[#D4AF37] dark:to-[#D4AF37]/30 rounded-r" />
                <div className="flex items-center gap-2 mb-3">
                  <HandHeart className="w-4 h-4 text-[#0A1F44] dark:text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#0A1F44] dark:text-[#D4AF37] uppercase tracking-[0.15em]">{t("prayerOfTheDay")}</span>
                </div>
                {verseLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ) : verse?.prayer ? (
                  <>
                    <p className="text-muted-foreground leading-relaxed italic line-clamp-4 mb-3 text-sm" data-testid="text-prayer-preview">
                      {verse.prayer}
                    </p>
                    <Link href="/devotion">
                      <Button variant="ghost" size="sm" className="text-[#0A1F44] dark:text-[#D4AF37] p-0 h-auto" data-testid="link-read-full-prayer">
                        {t("readFullPrayer")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Lord, guide our steps today...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Testimony Highlight Card */}
          <Card className="shadow-lg border-0 overflow-hidden" data-testid="card-testimony-highlight">
            <CardContent className="p-0">
              <div className="relative px-5 py-5">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#D4AF37]/70 to-[#D4AF37]/20 rounded-r" />
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.15em]">{t("testimonyHighlight")}</span>
                </div>
                {displayTestimonies.length > 0 ? (
                  <>
                    <p className="text-muted-foreground leading-relaxed italic line-clamp-4 mb-2 text-sm" data-testid="text-testimony-preview">
                      "{displayTestimonies[0].contentText}"
                    </p>
                    <p className="text-xs font-medium text-foreground mb-3">— {displayTestimonies[0].nameDisplay}</p>
                    <Link href="/prayer">
                      <Button variant="ghost" size="sm" className="text-[#D4AF37] p-0 h-auto" data-testid="link-view-testimonies">
                        {t("viewTestimonies")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground italic text-sm mb-3">{t("noTestimoniesYet")}</p>
                    <Link href="/prayer">
                      <Button variant="ghost" size="sm" className="text-[#D4AF37] p-0 h-auto">
                        {t("submitAPrayer")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════ ENCOURAGEMENT ═══════════════ */}
      {encouragement && (
        <section className="px-5 md:px-8 mt-6 max-w-5xl mx-auto w-full" data-testid="section-encouragement">
          <div className="relative rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44]/95 to-[#132D5E]/90 dark:from-[#060E22]/98 dark:to-[#0E2040]/92" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/8 rounded-full blur-2xl" />
            <div className="relative px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-serif font-semibold text-sm text-white/90">{t("encouragement")}</span>
              </div>
              <p className="text-white/80 leading-relaxed text-sm mb-2" data-testid="text-encouragement">
                {encouragement.text}
              </p>
              <p className="text-[#D4AF37] font-serif font-medium text-xs">— {encouragement.author}</p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ FEATURED MUSIC ═══════════════ */}
      <section className="px-5 md:px-8 mt-8 max-w-5xl mx-auto w-full" data-testid="section-featured-music">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-serif font-semibold text-xl text-foreground">{t("featuredMusic")}</h2>
            <p className="text-sm text-muted-foreground">{t("featuredMusicDesc")}</p>
          </div>
          <Link href="/music">
            <Button variant="ghost" size="sm" className="text-[#D4AF37] flex-shrink-0" data-testid="link-browse-all-music">
              {t("browseAll")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {featuredTrack && (
          <Card
            className="shadow-md overflow-hidden hover-elevate active-elevate-2 cursor-pointer mb-4"
            onClick={() => {
              if (featuredTrack.locked) {
                toast({ title: t("earlyAccessOnly"), description: t("earlyAccessDesc") });
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
            data-testid="card-featured-track"
          >
            <CardContent className="p-0">
              <div className="relative bg-gradient-to-r from-[#0A1F44] to-[#132D5E] dark:from-[#060E22] dark:to-[#0E2040]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="relative flex items-center gap-4 p-4">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-20 h-20 rounded-md bg-cover bg-center shadow-sm"
                      style={{
                        backgroundImage: featuredTrack.albumArt ? `url(${featuredTrack.albumArt})` : undefined,
                        backgroundColor: "hsl(var(--muted))",
                      }}
                    />
                    <div className="absolute inset-0 rounded-md bg-black/20 flex items-center justify-center">
                      {featuredTrack.locked ? (
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-[#0A1F44]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                          <Play className="w-5 h-5 text-[#0A1F44] ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] mb-1 no-default-hover-elevate no-default-active-elevate">
                      {t("nowPlaying")}
                    </Badge>
                    <p className="font-semibold text-white text-lg truncate" data-testid="text-featured-song-title">
                      {featuredTrack.title}
                    </p>
                    <p className="text-white/60 text-sm truncate">{featuredTrack.artist}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-[#D4AF37]">{featuredTrack.duration}</span>
                      {featuredTrack.isEarlyAccess && (
                        <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-[10px] px-1.5 py-0 no-default-hover-elevate no-default-active-elevate">
                          <Crown className="w-3 h-3 mr-0.5" />
                          {t("earlyAccess")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {displayTracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayTracks.slice(0, 4).map((track, idx) => (
              <Card
                key={track.id}
                className="shadow-sm overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => {
                  if (track.locked) {
                    toast({ title: t("earlyAccessOnly"), description: t("earlyAccessDesc") });
                    return;
                  }
                  const allTracks = tracks || [];
                  const trackIndex = allTracks.findIndex((tr) => tr.id === track.id);
                  playTrack(track, allTracks, trackIndex >= 0 ? trackIndex : 0);
                }}
                data-testid={`card-track-${track.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-md bg-cover bg-center"
                        style={{
                          backgroundImage: track.albumArt ? `url(${track.albumArt})` : undefined,
                          backgroundColor: "hsl(var(--muted))",
                        }}
                      />
                      <div className="absolute inset-0 rounded-md bg-black/15 flex items-center justify-center">
                        {track.locked ? (
                          <Lock className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{track.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════ PRAYER WALL ═══════════════ */}
      <section className="px-5 md:px-8 mt-8 max-w-5xl mx-auto w-full" data-testid="section-prayer-wall">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-serif font-semibold text-xl text-foreground">{t("prayerWall")}</h2>
            <p className="text-sm text-muted-foreground">{t("prayerWallDesc")}</p>
          </div>
          <Link href="/prayer">
            <Button variant="ghost" size="sm" className="text-[#D4AF37] flex-shrink-0" data-testid="link-view-all-prayers">
              {t("viewAll")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {displayPrayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayPrayers.map((pr: any) => (
              <Card key={pr.id} className="shadow-sm" data-testid={`card-prayer-${pr.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0A1F44]/8 dark:bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                      <HandHeart className="w-4 h-4 text-[#0A1F44] dark:text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">{pr.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-3">{pr.request || pr.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <HandHeart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("noPrayerRequestsYet")}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 text-center">
          <Link href="/prayer">
            <Button className="bg-[#0A1F44] dark:bg-[#D4AF37] text-white dark:text-[#0A1F44] border-[#0A1F44] dark:border-[#D4AF37]" data-testid="button-submit-prayer-request">
              <HandHeart className="w-4 h-4 mr-2" />
              {t("submitRequest")}
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══════════════ SUPPORT THE MISSION / PREMIUM ═══════════════ */}
      {(!user || !user.isPremium) && (
        <section className="px-5 md:px-8 mt-8 max-w-5xl mx-auto w-full" data-testid="section-premium">
          <Card className="shadow-md overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="relative bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040] px-6 py-8 md:px-10 md:py-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/6 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />

                <div className="relative z-10 md:flex md:items-center md:gap-10">
                  <div className="md:flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="w-5 h-5 text-[#D4AF37]" />
                      <h2 className="font-serif font-bold text-xl text-white">{t("supportTheMission")}</h2>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-lg">
                      {t("supportTheMissionDesc")}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {[t("saveFavorites"), t("createPlaylists"), t("prayerHistory"), t("fasterAccess")].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-white/80 text-sm">
                          <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Link href={user ? "/pricing" : "/login"}>
                        <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold" data-testid="button-view-plans">
                          <Crown className="w-4 h-4 mr-2" />
                          {t("viewPlans")}
                        </Button>
                      </Link>
                      <div className="flex items-center gap-1.5 text-white/40">
                        <span className="text-sm">{t("freePlan")}</span>
                        <span className="text-xs">|</span>
                        <span className="text-[#D4AF37] font-semibold text-sm">$4.99/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex md:flex-col md:items-center md:gap-3 md:w-48">
                    <div className="w-24 h-24 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
                      <Crown className="w-12 h-12 text-[#D4AF37]" />
                    </div>
                    <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] no-default-hover-elevate no-default-active-elevate">
                      Premium
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════ NOTIFICATION BANNER ═══════════════ */}
      {pushSupported && !pushEnabled && (
        <section className="px-5 md:px-8 mt-6 max-w-5xl mx-auto w-full" data-testid="section-notification-cta">
          <Card className="shadow-sm border-[#D4AF37]/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#D4AF37]/8 to-transparent">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm" data-testid="text-notification-banner-title">
                    {t("notificationBannerTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("notificationBannerDesc")}</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleTogglePush}
                  disabled={pushLoading}
                  className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold flex-shrink-0"
                  data-testid="button-notification-enable"
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  {t("turnOn")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="mt-10 pb-6 px-5 md:px-8 max-w-5xl mx-auto w-full" data-testid="section-footer">
        <div className="border-t border-border/50 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Bénédictions Partagées" className="w-8 h-8 rounded-md object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t("appName")}</p>
                <p className="text-xs text-muted-foreground">{t("tagline")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/devotion">
                <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">{t("devotion")}</span>
              </Link>
              <Link href="/music">
                <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">{t("music")}</span>
              </Link>
              <Link href="/prayer">
                <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">{t("prayer")}</span>
              </Link>
              <Link href="/support">
                <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">{t("support")}</span>
              </Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-4 text-center md:text-left">
            {t("scriptureAttribution")}
          </p>
        </div>
      </footer>

    </div>
  );
}
