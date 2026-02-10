import { useQuery } from "@tanstack/react-query";
import { Music, Video, BookOpen, HandHeart, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/LanguageContext";
import type { DailyVerse, Encouragement } from "@shared/schema";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const quickLinks = [
  { path: "/music", icon: Music, labelKey: "music", descKey: "exploreMusic", gradient: "from-amber-500/20 to-yellow-300/10 dark:from-amber-500/15 dark:to-yellow-400/5" },
  { path: "/videos", icon: Video, labelKey: "videos", descKey: "exploreVideos", gradient: "from-blue-500/20 to-indigo-300/10 dark:from-blue-500/15 dark:to-indigo-400/5" },
  { path: "/devotion", icon: BookOpen, labelKey: "devotion", descKey: "exploreDevotion", gradient: "from-emerald-500/20 to-teal-300/10 dark:from-emerald-500/15 dark:to-teal-400/5" },
  { path: "/prayer", icon: HandHeart, labelKey: "prayer", descKey: "explorePrayer", gradient: "from-rose-500/20 to-pink-300/10 dark:from-rose-500/15 dark:to-pink-400/5" },
];

export default function Home() {
  const { t, language } = useLanguage();

  const { data: verse, isLoading: verseLoading } = useQuery<DailyVerse>({
    queryKey: ["/api/daily-verse", language],
    queryFn: async () => {
      const res = await fetch(`/api/daily-verse?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch daily verse");
      return res.json();
    },
  });

  const { data: encouragement, isLoading: encouragementLoading } = useQuery<Encouragement>({
    queryKey: ["/api/encouragement", language],
    queryFn: async () => {
      const res = await fetch(`/api/encouragement?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch encouragement");
      return res.json();
    },
  });

  const today = new Date().toLocaleDateString(language === "fr" ? "fr-FR" : language === "ht" ? "fr-HT" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col min-h-full pb-20">

      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#2D4BA0] dark:from-[#0F1D45] dark:via-[#0F1D45] dark:to-[#1A2D6B] px-5 pt-8 pb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#EAB308]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={logoImage}
              alt="Bénédictions Partagées"
              className="w-14 h-14 rounded-full object-cover border-2 border-[#EAB308]/40 shadow-lg"
            />
            <div>
              <h1 className="font-serif text-2xl font-bold text-white leading-tight" data-testid="text-greeting">
                {t("blessedDay")}
              </h1>
              <p className="text-white/70 text-sm capitalize">{today}</p>
            </div>
          </div>
          <p className="text-white/80 text-base leading-relaxed" data-testid="text-blessed-greeting">
            {t("blessedGreeting")}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-5 relative z-10 space-y-6">

        <Card className="shadow-lg overflow-hidden border-0" data-testid="card-daily-verse">
          <CardContent className="p-0">
            <div className="relative px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#EAB308]" />
                <span className="text-xs font-bold text-[#EAB308] dark:text-[#EAB308] uppercase tracking-[0.2em]">
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
                    <div className="h-px w-8 bg-[#EAB308]/40" />
                    <p
                      className="text-center text-[#EAB308] dark:text-[#EAB308] font-serif font-semibold text-sm"
                      data-testid="text-verse-reference"
                    >
                      {verse.reference}
                    </p>
                    <div className="h-px w-8 bg-[#EAB308]/40" />
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

        <div className="space-y-3" data-testid="section-devotional-preview">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif font-semibold text-xl text-foreground">
              {t("todaysDevotional")}
            </h2>
            <Link href="/devotion" data-testid="link-read-more">
              <Button variant="ghost" size="sm">
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
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HandHeart className="w-5 h-5 text-primary" />
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

        <div className="relative rounded-xl overflow-hidden" data-testid="section-encouragement">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/90 to-[#2D4BA0]/80 dark:from-[#0F1D45]/95 dark:to-[#1A2D6B]/85" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAB308]/10 rounded-full blur-2xl" />

          <div className="relative px-6 py-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#EAB308]" />
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
                  className="text-white/85 leading-relaxed text-base mb-3"
                  data-testid="text-encouragement"
                >
                  {encouragement.text}
                </p>
                <p className="text-[#EAB308] font-serif font-medium text-sm">
                  — {encouragement.author}
                </p>
              </>
            ) : (
              <p className="text-white/85 leading-relaxed">
                God's love for you is endless. Take heart in knowing that you are never alone on this journey.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 pb-6" data-testid="section-quick-links">
          <h2 className="font-serif font-semibold text-xl text-foreground">
            {t("welcome")}
          </h2>
          <div className="space-y-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} href={link.path} data-testid={`link-explore-${link.labelKey}`}>
                  <Card className="hover-elevate active-elevate-2 cursor-pointer shadow-sm overflow-visible" data-testid={`card-explore-${link.labelKey}`}>
                    <CardContent className="p-0">
                      <div className={`flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r ${link.gradient}`}>
                        <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground mb-0.5">
                            {t(link.labelKey)}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {t(link.descKey)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
