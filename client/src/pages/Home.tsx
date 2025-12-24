import { useQuery } from "@tanstack/react-query";
import { Music, Video, BookOpen, HandHeart, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/LanguageContext";
import type { DailyVerse, Encouragement } from "@shared/schema";

const quickLinks = [
  { path: "/music", icon: Music, labelKey: "music", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { path: "/videos", icon: Video, labelKey: "videos", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { path: "/devotion", icon: BookOpen, labelKey: "devotion", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { path: "/prayer", icon: HandHeart, labelKey: "prayer", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
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

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div 
        className="relative min-h-[45vh] flex items-end justify-center px-4 py-8 bg-gradient-to-b from-primary/20 via-primary/10 to-background"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f97316'/%3E%3Cstop offset='50%25' stop-color='%23fb923c'/%3E%3Cstop offset='100%25' stop-color='%23fcd34d'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23sky)' width='1200' height='800'/%3E%3Ccircle cx='600' cy='600' r='120' fill='%23fbbf24' opacity='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
        }}
      >
        <div className="text-center max-w-md mx-auto">
          <p className="text-white/80 text-sm font-medium mb-2 tracking-wide uppercase">
            {t("todaysVerse")}
          </p>
          {verseLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full bg-white/20" />
              <Skeleton className="h-6 w-3/4 mx-auto bg-white/20" />
              <Skeleton className="h-4 w-1/2 mx-auto bg-white/20" />
            </div>
          ) : verse ? (
            <>
              <p 
                className="font-serif text-xl md:text-2xl text-white leading-relaxed italic mb-3"
                data-testid="text-daily-verse"
              >
                "{verse.verse}"
              </p>
              <p className="text-white/90 text-sm font-medium" data-testid="text-verse-reference">
                — {verse.reference}
              </p>
            </>
          ) : (
            <p className="font-serif text-xl text-white italic">
              "For I know the plans I have for you, declares the Lord."
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6 space-y-6">
        <Card className="border-none shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-serif font-semibold text-foreground">
                {t("encouragement")}
              </h2>
            </div>
            
            {encouragementLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </div>
            ) : encouragement ? (
              <>
                <p 
                  className="text-muted-foreground leading-relaxed mb-2"
                  data-testid="text-encouragement"
                >
                  {encouragement.text}
                </p>
                <p className="text-sm text-primary font-medium">
                  — {encouragement.author}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                God's love for you is endless. Take heart in knowing that you are never alone on this journey.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-serif font-semibold text-lg text-foreground px-1">
            {t("welcome")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} href={link.path}>
                  <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center min-h-[100px]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${link.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {t(link.labelKey)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <Link href="/devotion">
          <Card className="hover-elevate active-elevate-2 cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("dailyDevotion")}</p>
                  <p className="text-sm text-muted-foreground">{t("todaysDevotional")}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
