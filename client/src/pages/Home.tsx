import { useQuery } from "@tanstack/react-query";
import { Music, Video, BookOpen, HandHeart, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/LanguageContext";
import type { DailyVerse, Encouragement } from "@shared/schema";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const quickLinks = [
  { path: "/music", icon: Music, labelKey: "music", color: "bg-[#EAB308]/10 text-[#EAB308] dark:text-[#EAB308]" },
  { path: "/videos", icon: Video, labelKey: "videos", color: "bg-primary/10 text-primary" },
  { path: "/devotion", icon: BookOpen, labelKey: "devotion", color: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400" },
  { path: "/prayer", icon: HandHeart, labelKey: "prayer", color: "bg-rose-500/10 text-rose-500 dark:text-rose-400" },
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
      <div className="px-5 pt-6 pb-4 space-y-1">
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="px-5 space-y-6">
        <Card className="shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-primary/5 dark:bg-primary/10 px-6 py-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                {t("todaysVerse")}
              </p>
              {verseLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-4/6" />
                  <Skeleton className="h-4 w-1/3 mt-3" />
                </div>
              ) : verse ? (
                <>
                  <p 
                    className="font-serif font-semibold text-lg text-foreground leading-relaxed mb-1"
                    data-testid="text-verse-reference"
                  >
                    {verse.reference}
                  </p>
                  <blockquote 
                    className="text-foreground/90 leading-relaxed text-base italic"
                    data-testid="text-daily-verse"
                  >
                    &laquo; {verse.verse} &raquo;
                  </blockquote>
                </>
              ) : (
                <p className="font-serif text-lg text-foreground italic leading-relaxed">
                  &laquo; For I know the plans I have for you, declares the Lord. &raquo;
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-serif font-semibold text-xl text-foreground">
            {t("todaysDevotional")}
          </h2>
          
          {verseLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : verse ? (
            <p 
              className="text-muted-foreground leading-relaxed"
              data-testid="text-devotional-preview"
            >
              {verse.devotional?.slice(0, 150)}...
            </p>
          ) : null}

          <Link href="/devotion">
            <span className="text-sm text-primary font-medium inline-flex items-center gap-1 mt-1 cursor-pointer" data-testid="link-read-more">
              {t("dailyDevotion")}
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <Card className="shadow-md">
          <CardContent className="p-5">
            <h2 className="font-serif font-semibold text-xl text-foreground mb-3">
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
                className="text-muted-foreground leading-relaxed italic"
                data-testid="text-prayer-preview"
              >
                {verse.prayer?.slice(0, 120)}...
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-5">
            <h2 className="font-serif font-semibold text-lg text-foreground mb-3">
              {t("encouragement")}
            </h2>
            
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
                <p className="text-sm text-[#EAB308] dark:text-[#EAB308] font-medium">
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

        <div className="space-y-3 pb-4">
          <h2 className="font-serif font-semibold text-lg text-foreground px-1">
            {t("welcome")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} href={link.path}>
                  <Card className="hover-elevate active-elevate-2 cursor-pointer h-full shadow-sm">
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
      </div>
    </div>
  );
}
