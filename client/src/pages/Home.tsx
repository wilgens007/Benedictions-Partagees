import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Music, BookOpen, HandHeart, ChevronRight, Sparkles, Bell,
  Play, Crown, Lock, Heart, Headphones, BookMarked,
  ArrowRight, Quote, Check, Share2, Bookmark
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
import type { DailyVerse, Encouragement, MusicTrack, Testimony, Video } from "@shared/schema";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, isPushSupported } from "@/lib/pushNotifications";
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

  const { data: videosData } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const featuredTrack = featuredSong || tracks?.[0];
  const nextTrack = tracks && tracks.length > 1 ? tracks[1] : null;
  const displayTracks = tracks?.filter(tr => !tr.locked) || [];
  const displayPrayers = prayerRequests?.slice(0, 3) || [];
  const displayTestimonies = testimoniesData?.slice(0, 2) || [];
  const displayVideos = videosData?.slice(0, 4) || [];

  const worshipPlaylists = [
    {
      id: "worship-flow",
      titleKey: "playlistWorshipFlow",
      genre: "Afrobeat",
      trackCount: displayTracks.length > 6 ? Math.min(displayTracks.length, 18) : displayTracks.length,
      gradient: "from-orange-600/90 to-amber-700/80",
      albumArt: displayTracks[0]?.albumArt,
      startIndex: 0,
    },
    {
      id: "kompa-praise",
      titleKey: "playlistKompaPraise",
      genre: "Kompa",
      trackCount: displayTracks.length > 3 ? Math.min(12, displayTracks.length) : displayTracks.length,
      gradient: "from-emerald-700/90 to-teal-800/80",
      albumArt: displayTracks[2]?.albumArt,
      startIndex: 2,
    },
    {
      id: "quiet-time",
      titleKey: "playlistQuietTime",
      genre: language === "fr" ? "Louange Douce" : language === "ht" ? "Lwanj Dous" : "Soft Worship",
      trackCount: displayTracks.length > 0 ? Math.min(displayTracks.length, 10) : 0,
      gradient: "from-sky-700/90 to-indigo-800/80",
      albumArt: displayTracks[4]?.albumArt,
      startIndex: 4,
    },
  ];

  const handlePlayPlaylist = (startIndex: number) => {
    if (displayTracks.length > 0) {
      const idx = Math.min(startIndex, displayTracks.length - 1);
      playTrack(displayTracks[idx], displayTracks, idx);
    }
  };

  return (
    <div className="flex flex-col min-h-full">

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040]"
        data-testid="section-hero"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 pt-8 pb-14 md:pt-14 md:pb-20 md:px-8">
          <div className="md:flex md:items-start md:gap-10">
            <div className="md:flex-1">
              <div className="flex items-center gap-3 mb-5 md:hidden">
                <img
                  src={logoImage}
                  alt="Bénédictions Partagées"
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg"
                />
                <p className="text-[#D4AF37]/80 text-xs font-semibold uppercase tracking-widest">{t("tagline")}</p>
              </div>

              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-2" data-testid="text-hero-headline">
                {t("heroTitle")}
              </h1>
              <p className="font-serif text-lg md:text-xl text-white/80 mb-4" data-testid="text-hero-subtitle">
                {t("heroHeadline")}
              </p>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-7 max-w-lg" data-testid="text-hero-subtext">
                {t("heroSubtext")}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
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
            <div className="hidden md:block md:w-80 mt-2">
              {featuredTrack && (
                <Card
                  className="shadow-xl border-0 overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => {
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
                  }}
                  data-testid="card-now-playing-hero"
                >
                  <CardContent className="p-0">
                    <div className="relative bg-gradient-to-br from-[#1a3a6e] to-[#0d2040]">
                      <div className="absolute inset-0 opacity-30">
                        {featuredTrack.albumArt && (
                          <div className="w-full h-full bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${featuredTrack.albumArt})` }} />
                        )}
                      </div>
                      <div className="relative p-5">
                        <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-xs mb-3 no-default-hover-elevate no-default-active-elevate" data-testid="badge-now-playing">
                          {t("nowPlaying")}
                        </Badge>
                        <p className="font-serif font-bold text-white text-xl mb-1 truncate" data-testid="text-featured-song-title">
                          "{featuredTrack.title}"
                        </p>
                        <p className="text-white/60 text-sm mb-4">{featuredTrack.artist}</p>
                        <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold" data-testid="button-hero-play">
                          <Play className="w-4 h-4 mr-2" />
                          {t("play")}
                        </Button>
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
          <div className="md:hidden mt-6">
            {featuredTrack && (
              <Card
                className="shadow-lg border-0 overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                onClick={() => {
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
                }}
                data-testid="card-now-playing-mobile"
              >
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-r from-[#1a3a6e] to-[#0d2040]">
                    <div className="relative flex items-center gap-4 p-4">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-16 h-16 rounded-md bg-cover bg-center"
                          style={{
                            backgroundImage: featuredTrack.albumArt ? `url(${featuredTrack.albumArt})` : undefined,
                            backgroundColor: "#1a3a6e",
                          }}
                        />
                        <div className="absolute inset-0 rounded-md bg-black/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
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
      <section className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full" data-testid="section-todays-blessing">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-6" data-testid="text-todays-blessing-title">
          {t("todaysBlessing")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Verse Card */}
          <Card className="shadow-md overflow-hidden" data-testid="card-daily-verse">
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
          <Card className="shadow-md overflow-hidden" data-testid="card-prayer-of-day">
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
          <Card className="shadow-md overflow-hidden" data-testid="card-testimony-highlight">
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

      {/* ═══════════════ FEATURED WORSHIP — Playlist Cards ═══════════════ */}
      <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-featured-worship">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-6">{t("featuredWorship")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {worshipPlaylists.map((pl) => (
            <Card
              key={pl.id}
              className="shadow-md overflow-hidden cursor-pointer hover-elevate active-elevate-2 border-0"
              onClick={() => handlePlayPlaylist(pl.startIndex)}
              data-testid={`card-playlist-${pl.id}`}
            >
              <CardContent className="p-0">
                <div className="relative h-44 sm:h-40">
                  {pl.albumArt ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${pl.albumArt})` }} />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44] to-[#132D5E]" />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t ${pl.gradient}`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <p className="font-bold text-white text-lg leading-tight mb-0.5">{t(pl.titleKey)}</p>
                    <p className="text-white/70 text-xs mb-3">{pl.genre} {pl.trackCount > 0 ? `\u00b7 ${pl.trackCount} Tracks` : ""}</p>
                    <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-xs w-fit no-default-hover-elevate no-default-active-elevate">
                      <Play className="w-3 h-3 mr-1" />
                      {t("play")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════ VIDEO TEACHINGS ═══════════════ */}
      <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-video-teachings">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-bold text-2xl text-foreground">{t("videoTeachings")}</h2>
          <Link href="/videos">
            <Button variant="ghost" size="sm" className="text-[#D4AF37]" data-testid="link-see-all-videos">
              {t("seeAll")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {displayVideos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayVideos.map((video) => (
              <Link key={video.id} href="/videos">
                <Card
                  className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer shadow-sm"
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
              { labelKey: "sermons", icon: BookOpen, desc: "sermonsDesc" },
              { labelKey: "worship", icon: Music, desc: "worshipDesc" },
              { labelKey: "teachings", icon: Sparkles, desc: "teachingsDesc" },
            ].map((cat) => (
              <Link key={cat.labelKey} href="/videos">
                <Card className="hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible" data-testid={`card-video-category-${cat.labelKey}`}>
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
      <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-prayer-wall">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-6">{t("prayerWall")}</h2>

        {displayPrayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayPrayers.map((pr: any) => (
              <Card key={pr.id} className="shadow-sm" data-testid={`card-prayer-${pr.id}`}>
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-2">{pr.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{pr.request || pr.message}</p>
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

        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
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
        <section className="px-5 md:px-8 pb-8 md:pb-12 max-w-5xl mx-auto w-full" data-testid="section-premium">
          <div className="relative rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44]/95 to-[#132D5E]/90 dark:from-[#060E22]/98 dark:to-[#0E2040]/95" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/6 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />

            <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
              <h2 className="font-serif font-bold text-2xl text-white text-center mb-6" data-testid="text-upgrade-title">
                {t("upgradeToPremium")}
              </h2>

              {/* Tab Toggle */}
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex rounded-md overflow-hidden border border-white/20">
                  <button
                    onClick={() => setPremiumTab("free")}
                    className={`px-6 py-2 text-sm font-semibold transition-colors ${
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
                    className={`px-6 py-2 text-sm font-semibold transition-colors ${
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

              {/* Plan Features */}
              <div className="max-w-sm mx-auto">
                {premiumTab === "free" ? (
                  <ul className="space-y-3 mb-6">
                    {[t("listenAnytime"), t("dailyVerses")].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-white/80 text-sm">
                        <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-3 mb-6">
                    {[t("saveFavorites"), t("createPlaylists"), t("noAdsOffline")].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-white/80 text-sm">
                        <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
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

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="py-6 px-5 md:px-8 text-center border-t border-border/30" data-testid="section-footer">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {t("appName")}
        </p>
      </footer>

    </div>
  );
}
