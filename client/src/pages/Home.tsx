import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Music, BookOpen, HandHeart, ChevronRight, Sparkles, Bell,
  Play, Crown, Lock, Heart, Headphones, BookMarked,
  ArrowRight, Quote, Check, Share2, Bookmark, ChevronLeft, Pause, Youtube
} from "lucide-react";
import { SiFacebook, SiInstagram } from "react-icons/si";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useAuth } from "@/lib/AuthContext";
import type { DailyVerse, Encouragement, MusicTrack, Testimony, Video } from "@shared/schema";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, isPushSupported } from "@/lib/pushNotifications";
import { useScrollRevealChildren } from "@/hooks/useScrollReveal";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

export default function Home() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [premiumTab, setPremiumTab] = useState<"free" | "premium">("premium");
  const pushSupported = isPushSupported();

  const blessingRef = useScrollRevealChildren();
  const worshipRef = useScrollRevealChildren();
  const videoRef = useScrollRevealChildren();
  const prayerRef = useScrollRevealChildren();
  const premiumRef = useScrollRevealChildren();

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
        if (success) { setPushEnabled(false); toast({ title: t("notificationsDisabled") }); }
      } else {
        const success = await subscribeToPush(language);
        if (success) { setPushEnabled(true); toast({ title: t("notificationsEnabled") }); }
        else { toast({ title: t("notificationsDenied"), variant: "destructive" }); }
      }
    } catch { toast({ title: t("error"), variant: "destructive" }); }
    setPushLoading(false);
  };

  const { data: verse, isLoading: verseLoading } = useQuery<DailyVerse>({
    queryKey: ["/api/daily-verse", language],
    queryFn: async () => {
      const res = await fetch(`/api/daily-verse?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch daily verse");
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
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

  const { data: tracks = [] } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music"],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: featuredSong } = useQuery<MusicTrack | null>({
    queryKey: ["/api/music/featured"],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: prayerRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/prayer-requests"],
    staleTime: 60 * 1000,
  });

  const { data: testimoniesData = [] } = useQuery<Testimony[]>({
    queryKey: ["/api/testimonies"],
    staleTime: 60 * 1000,
  });

  const { data: videosData = [] } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const featuredTrack = featuredSong || tracks[0] || null;
  const nextTrack = tracks.length > 1 ? tracks[1] : null;
  const displayTracks = tracks.filter(tr => !tr.locked);
  const displayPrayers = Array.isArray(prayerRequests) ? prayerRequests.slice(0, 3) : [];
  const displayTestimonies = testimoniesData.slice(0, 2);
  const displayVideos = videosData.slice(0, 4);

  const carouselTracks = displayTracks.slice(0, 8);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", skipSnaps: false, dragFree: false },
    prefersReducedMotion ? [] : [autoplayPlugin.current]
  );

  const [selectedCarouselIndex, setSelectedCarouselIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedCarouselIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handlePlayFeatured = () => {
    if (!featuredTrack) return;
    if (featuredTrack.locked) {
      toast({ title: t("earlyAccessOnly"), description: t("earlyAccessDesc") });
      return;
    }
    if (tracks && tracks.length > 0) {
      const idx = tracks.findIndex((tr) => tr.id === featuredTrack.id);
      playTrack(tracks[idx >= 0 ? idx : 0], tracks, idx >= 0 ? idx : 0);
    } else {
      playTrack(featuredTrack, [featuredTrack], 0);
    }
  };

  const handlePlayCarouselTrack = (track: MusicTrack) => {
    if (track.locked) {
      toast({ title: t("earlyAccessOnly"), description: t("earlyAccessDesc") });
      return;
    }
    const idx = displayTracks.findIndex((tr) => tr.id === track.id);
    playTrack(displayTracks[idx >= 0 ? idx : 0], displayTracks, idx >= 0 ? idx : 0);
  };

  return (
    <div className="flex flex-col min-h-full">

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        className="relative overflow-hidden"
        data-testid="section-hero"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040]" />

        {featuredTrack?.albumArt && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-md"
            style={{ backgroundImage: `url(${featuredTrack.albumArt})` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F44] via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 pt-10 pb-16 md:pt-16 md:pb-24 md:px-8">
          <div className="md:flex md:items-center md:gap-12">
            <div className="md:flex-1">
              <div className="flex items-center gap-3 mb-5 md:hidden animate-hero-enter">
                <img
                  src={logoImage}
                  alt="Bénédictions Partagées"
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg"
                  loading="lazy"
                />
                <p className="text-[#D4AF37]/80 text-xs font-semibold uppercase tracking-widest">{t("tagline")}</p>
              </div>

              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-3 animate-hero-enter" data-testid="text-hero-headline">
                {t("heroTitle")}
              </h1>
              <p className="font-serif text-lg md:text-xl text-white/80 mb-3 animate-hero-enter-delay-1" data-testid="text-hero-subtitle">
                {t("heroHeadline")}
              </p>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8 max-w-lg animate-hero-enter-delay-2" data-testid="text-hero-subtext">
                {t("heroSubtext")}
              </p>

              <div className="flex items-center gap-3 flex-wrap animate-hero-enter-delay-3">
                <Link href="/music">
                  <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold" data-testid="button-hero-listen">
                    <Play className="w-4 h-4 mr-2" />
                    {t("startListening")}
                  </Button>
                </Link>
                <Link href="/prayer">
                  <Button variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/5 font-semibold" data-testid="button-hero-prayer">
                    <HandHeart className="w-4 h-4 mr-2" />
                    {t("submitAPrayer")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Now Playing Card (desktop) */}
            <div className="hidden md:block md:w-80 animate-hero-enter-delay-2">
              {featuredTrack && (
                <Card
                  className="shadow-2xl border-0 overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={handlePlayFeatured}
                  data-testid="card-now-playing-hero"
                >
                  <CardContent className="p-0">
                    <div className="relative bg-gradient-to-br from-[#1a3a6e] to-[#0d2040]">
                      <div className="absolute inset-0 opacity-30">
                        {featuredTrack.albumArt && (
                          <img
                            src={featuredTrack.albumArt}
                            alt=""
                            className="w-full h-full object-cover blur-sm"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="relative p-5">
                        <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-xs mb-3 no-default-hover-elevate no-default-active-elevate" data-testid="badge-now-playing">
                          {t("nowPlaying")}
                        </Badge>
                        <p className="font-serif font-bold text-white text-xl mb-1 truncate" data-testid="text-featured-song-title">
                          "{featuredTrack.title}"
                        </p>
                        <p className="text-white/60 text-sm mb-5">{featuredTrack.artist}</p>

                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center animate-gentle-glow" data-testid="button-hero-play-glow">
                            <Play className="w-5 h-5 text-[#0A1F44] ml-0.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white/80 text-xs font-medium">{t("play")}</p>
                            {featuredTrack.duration && (
                              <p className="text-white/40 text-[10px]">{featuredTrack.duration}</p>
                            )}
                          </div>
                        </div>

                        {nextTrack && (
                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                            <span className="text-white/40 text-xs">{t("upNext")}:</span>
                            <span className="text-white/70 text-xs truncate flex-1">{nextTrack.title}</span>
                            <span className="text-white/40 text-xs">{nextTrack.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Now Playing Card (mobile) */}
          <div className="md:hidden mt-7 animate-hero-enter-delay-3">
            {featuredTrack && (
              <Card
                className="shadow-lg border-0 overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                onClick={handlePlayFeatured}
                data-testid="card-now-playing-mobile"
              >
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-r from-[#1a3a6e] to-[#0d2040]">
                    <div className="relative flex items-center gap-4 p-4">
                      <div className="relative flex-shrink-0">
                        {featuredTrack.albumArt ? (
                          <img
                            src={featuredTrack.albumArt}
                            alt={featuredTrack.title}
                            className="w-16 h-16 rounded-md object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-[#1a3a6e]" />
                        )}
                        <div className="absolute inset-0 rounded-md bg-black/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center animate-gentle-glow">
                            <Play className="w-4 h-4 text-[#0A1F44] ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] mb-1 no-default-hover-elevate no-default-active-elevate" data-testid="badge-now-playing-mobile">
                          {t("nowPlaying")}
                        </Badge>
                        <p className="font-semibold text-white truncate" data-testid="text-mobile-song-title">{featuredTrack.title}</p>
                        <p className="text-white/60 text-xs truncate">{featuredTrack.artist}</p>
                      </div>
                    </div>
                    {nextTrack && (
                      <div className="px-4 pb-3 flex items-center gap-2 border-t border-white/10 pt-2">
                        <span className="text-white/40 text-xs">{t("upNext")}:</span>
                        <span className="text-white/70 text-xs truncate flex-1">{nextTrack.title}</span>
                        <span className="text-white/40 text-xs">{nextTrack.duration}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ TODAY'S BLESSING — 3 Cards ═══════════════ */}
      <section className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full" data-testid="section-todays-blessing" ref={blessingRef}>
        <h2 className="font-serif font-bold text-2xl text-foreground mb-6 animate-fade-in-up" data-testid="text-todays-blessing-title">
          {t("todaysBlessing")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Verse Card */}
          <Card className="shadow-md overflow-hidden animate-fade-in-up animate-stagger-1" data-testid="card-daily-verse">
            <CardContent className="p-0">
              <div className="bg-[#D4AF37] px-4 py-2">
                <span className="text-sm font-bold text-[#0A1F44]">{t("dailyVerse")}</span>
              </div>
              <div className="px-5 py-4">
                {verseLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-4 w-1/3 mt-3" />
                  </div>
                ) : verse ? (
                  <>
                    <blockquote className="font-serif text-sm text-foreground leading-relaxed italic mb-1 line-clamp-3" data-testid="text-daily-verse">
                      "{verse.verse}"
                    </blockquote>
                    <p className="text-muted-foreground text-xs mb-4" data-testid="text-verse-reference">
                      ({verse.reference})
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link href="/devotion">
                        <Button variant="ghost" size="sm" className="text-[#D4AF37] p-0 h-auto text-xs" data-testid="button-save-verse">
                          <Bookmark className="w-3.5 h-3.5 mr-1" />
                          {t("saveVerse")}
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-muted-foreground p-0 h-auto text-xs" data-testid="button-share-verse"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ text: `${verse.verse} — ${verse.reference}` }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(`${verse.verse} — ${verse.reference}`);
                            toast({ title: t("copiedToClipboard") });
                          }
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5 mr-1" />
                        {t("share") || "Share"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="font-serif text-sm text-foreground italic">"Be still, and know that I am God..."</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prayer of the Day Card */}
          <Card className="shadow-md overflow-hidden animate-fade-in-up animate-stagger-2" data-testid="card-prayer-of-day">
            <CardContent className="p-0">
              <div className="bg-[#0A1F44] dark:bg-[#132D5E] px-4 py-2">
                <span className="text-sm font-bold text-white">{t("prayerOfTheDay")}</span>
              </div>
              <div className="px-5 py-4">
                {verseLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                ) : verse?.prayer ? (
                  <>
                    <p className="text-muted-foreground leading-relaxed text-sm line-clamp-3 mb-4" data-testid="text-prayer-preview">
                      {verse.prayer}
                    </p>
                    <Link href="/devotion">
                      <Button variant="outline" size="sm" className="text-[#0A1F44] dark:text-[#D4AF37] border-[#0A1F44] dark:border-[#D4AF37] font-semibold text-xs" data-testid="button-read-full-prayer">
                        {t("readFullPrayer")}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Lord, strengthen our faith and give us peace...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Testimony Highlight Card */}
          <Card className="shadow-md overflow-hidden animate-fade-in-up animate-stagger-3" data-testid="card-testimony-highlight">
            <CardContent className="p-0">
              <div className="bg-[#D4AF37]/80 px-4 py-2">
                <span className="text-sm font-bold text-[#0A1F44]">{t("testimonyHighlight")}</span>
              </div>
              <div className="px-5 py-4">
                {displayTestimonies.length > 0 ? (
                  <>
                    <p className="text-muted-foreground leading-relaxed italic text-sm line-clamp-3 mb-4" data-testid="text-testimony-preview">
                      "{displayTestimonies[0].contentText}"
                    </p>
                    <Link href="/prayer">
                      <span className="text-[#D4AF37] text-xs font-medium cursor-pointer inline-flex items-center gap-1" data-testid="link-view-testimonies">
                        {t("viewTestimonies")} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground italic text-sm mb-3">{t("noTestimoniesYet")}</p>
                    <Link href="/prayer">
                      <span className="text-[#D4AF37] text-xs font-medium cursor-pointer inline-flex items-center gap-1">
                        {t("submitAPrayer")} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════ NOTIFICATION BANNER ═══════════════ */}
      {pushSupported && !pushEnabled && (
        <section className="px-5 md:px-8 pb-6 max-w-5xl mx-auto w-full" data-testid="section-notification-cta">
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

      {/* ═══════════════ FEATURED MUSIC CAROUSEL ═══════════════ */}
      {carouselTracks.length > 0 && (
        <section className="pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-featured-music-carousel" ref={worshipRef}>
          <div className="px-5 md:px-8 flex items-center justify-between mb-5 animate-fade-in-up">
            <h2 className="font-serif font-bold text-2xl text-foreground">{t("featuredWorship")}</h2>
            <Link href="/music">
              <Button variant="ghost" size="sm" className="text-[#D4AF37]" data-testid="link-see-all-music">
                {t("seeAll")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="relative animate-fade-in-up animate-stagger-2">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4 pl-5 md:pl-8">
                {carouselTracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className="flex-none w-44 sm:w-52"
                      data-testid={`carousel-track-${track.id}`}
                    >
                      <div
                        className="relative rounded-md overflow-hidden cursor-pointer group"
                        onClick={() => handlePlayCarouselTrack(track)}
                      >
                        <div className="aspect-square">
                          {track.albumArt ? (
                            <img
                              src={track.albumArt}
                              alt={track.title}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0A1F44] to-[#132D5E] flex items-center justify-center">
                              <Music className="w-10 h-10 text-[#D4AF37]/40" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                            isCurrentTrack && isPlaying
                              ? "bg-[#D4AF37] animate-gentle-glow"
                              : "bg-white/90 group-hover:bg-[#D4AF37] group-hover:scale-105"
                          }`}>
                            {isCurrentTrack && isPlaying ? (
                              <Pause className="w-4 h-4 text-[#0A1F44]" />
                            ) : (
                              <Play className="w-4 h-4 text-[#0A1F44] ml-0.5" />
                            )}
                          </div>
                        </div>
                        {track.locked && (
                          <div className="absolute top-2 right-2">
                            <Lock className="w-4 h-4 text-white/70" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 px-0.5">
                        <p className={`font-medium text-sm truncate ${isCurrentTrack ? "text-[#D4AF37]" : "text-foreground"}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex-none w-5 md:w-8" aria-hidden="true" />
              </div>
            </div>

            {carouselTracks.length > 3 && (
              <>
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 items-center justify-center text-foreground shadow-md transition-opacity duration-150 hover:bg-background disabled:opacity-0"
                  disabled={!canScrollPrev}
                  data-testid="button-carousel-prev"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 items-center justify-center text-foreground shadow-md transition-opacity duration-150 hover:bg-background disabled:opacity-0"
                  disabled={!canScrollNext}
                  data-testid="button-carousel-next"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {carouselTracks.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4" data-testid="carousel-dots">
                {carouselTracks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`rounded-full transition-all duration-200 ${
                      index === selectedCarouselIndex
                        ? "w-6 h-2 bg-[#D4AF37]"
                        : "w-2 h-2 bg-muted-foreground/30"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === selectedCarouselIndex ? "true" : undefined}
                    data-testid={`carousel-dot-${index}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════ VIDEO TEACHINGS ═══════════════ */}
      <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-video-teachings" ref={videoRef}>
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <h2 className="font-serif font-bold text-2xl text-foreground">{t("videoTeachings")}</h2>
          <Link href="/videos">
            <Button variant="ghost" size="sm" className="text-[#D4AF37]" data-testid="link-see-all-videos">
              {t("seeAll")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {displayVideos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayVideos.map((video, i) => (
              <Link key={video.id} href="/videos">
                <Card
                  className={`overflow-hidden hover-elevate active-elevate-2 cursor-pointer shadow-sm animate-fade-in-up animate-stagger-${Math.min(i + 1, 4)}`}
                  data-testid={`card-video-${video.id}`}
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-[#0A1F44] ml-0.5" />
                      </div>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-[#0A1F44]/80 text-white text-[10px] border-0 no-default-hover-elevate no-default-active-elevate capitalize">
                      {video.category}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2">{video.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { labelKey: "sermons", icon: BookOpen },
              { labelKey: "worship", icon: Music },
              { labelKey: "teachings", icon: Sparkles },
            ].map((cat, i) => (
              <Link key={cat.labelKey} href="/videos">
                <Card className={`hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible animate-fade-in-up animate-stagger-${i + 1}`} data-testid={`card-video-category-${cat.labelKey}`}>
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#0A1F44]/8 dark:bg-[#D4AF37]/15 flex items-center justify-center">
                      <cat.icon className="w-5 h-5 text-[#0A1F44] dark:text-[#D4AF37]" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{t(cat.labelKey)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════ PRAYER WALL ═══════════════ */}
      <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-prayer-wall" ref={prayerRef}>
        <h2 className="font-serif font-bold text-2xl text-foreground mb-6 animate-fade-in-up">{t("prayerWall")}</h2>

        {displayPrayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayPrayers.map((pr: any, i: number) => (
              <Card key={pr.id} className={`shadow-sm animate-fade-in-up animate-stagger-${Math.min(i + 1, 3)}`} data-testid={`card-prayer-${pr.id}`}>
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-2">{pr?.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{pr?.request || pr?.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm animate-fade-in-up">
            <CardContent className="p-6 text-center">
              <HandHeart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("noPrayerRequestsYet")}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap animate-fade-in-up animate-stagger-3">
          <Link href="/prayer">
            <Button variant="outline" className="border-[#0A1F44] dark:border-[#D4AF37] text-[#0A1F44] dark:text-[#D4AF37] font-semibold" data-testid="button-view-all-requests">
              {t("viewAllRequests")}
            </Button>
          </Link>
          <Link href="/prayer">
            <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold" data-testid="button-submit-prayer-request">
              {t("submitAPrayer")}
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══════════════ UPGRADE TO PREMIUM ═══════════════ */}
      {(!user || !user.isPremium) && (
        <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-premium" ref={premiumRef}>
          <div className="relative rounded-md overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44]/95 to-[#132D5E]/90 dark:from-[#060E22]/98 dark:to-[#0E2040]/95" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/6 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />

            <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
              <h2 className="font-serif font-bold text-2xl text-white text-center mb-6" data-testid="text-upgrade-title">
                {t("upgradeToPremium")}
              </h2>

              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex rounded-md overflow-hidden border border-white/20">
                  <button
                    onClick={() => setPremiumTab("free")}
                    className={`px-6 py-2 text-sm font-semibold transition-colors duration-150 ${
                      premiumTab === "free"
                        ? "bg-white text-[#0A1F44]"
                        : "bg-transparent text-white/60"
                    }`}
                    data-testid="button-tab-free"
                  >
                    {t("freePlan")}
                  </button>
                  <button
                    onClick={() => setPremiumTab("premium")}
                    className={`px-6 py-2 text-sm font-semibold transition-colors duration-150 ${
                      premiumTab === "premium"
                        ? "bg-[#D4AF37] text-[#0A1F44]"
                        : "bg-transparent text-white/60"
                    }`}
                    data-testid="button-tab-premium"
                  >
                    {t("premiumPlan")}
                  </button>
                </div>
              </div>

              <div className="max-w-sm mx-auto">
                {premiumTab === "free" ? (
                  <div className="mb-6">
                    <p className="text-white/50 text-xs text-center mb-3">Enjoy uplifting content anytime, anywhere.</p>
                    <ul className="space-y-3">
                      {[
                        t("listenAnytime") || "Listen anytime",
                        t("dailyVerses") || "Daily Bible verse",
                        "Submit prayer requests",
                        "Access to all sermons",
                        "Testimonies",
                        "Worship music",
                        "Teachings",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-white/80 text-sm">
                          <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-white/50 text-xs text-center mb-3">Unlock the full experience.</p>
                    <ul className="space-y-3">
                      {[
                        t("saveFavorites") || "Everything in Free",
                        "Early access to new releases",
                        t("createPlaylists") || "Create and save your own playlists",
                        "Exclusive premium content",
                        "Priority access to special teachings",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-white/80 text-sm">
                          <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-center">
                  <Link href={user ? "/pricing" : "/login"}>
                    <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-bold" data-testid="button-upgrade-now">
                      {t("upgradeNow")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="py-6 px-5 md:px-8 text-center border-t border-border/30" data-testid="section-footer">
        <div className="flex items-center justify-center gap-4 mb-3">
          <a
            href="https://www.facebook.com/share/1A82SPwjrB/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors"
            data-testid="link-footer-facebook"
            aria-label="Facebook"
          >
            <SiFacebook className="w-5 h-5" />
          </a>
          <a
            href="https://youtube.com/@benedictionspartagees?si=zwojIRYi5-xp7EOD"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors"
            data-testid="link-footer-youtube"
            aria-label="YouTube"
          >
            <Youtube className="w-5 h-5" />
          </a>
          <a
            href="https://www.instagram.com/benedictions_partagees?igsh=MXhscHBtNWhyYXlqdg=="
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors"
            data-testid="link-footer-instagram"
            aria-label="Instagram"
          >
            <SiInstagram className="w-5 h-5" />
          </a>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
          <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
            About
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
            Terms of Use
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {t("appName")}
        </p>
      </footer>

    </div>
  );
}
