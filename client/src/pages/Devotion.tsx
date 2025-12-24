import { useQuery } from "@tanstack/react-query";
import { Share2, Bookmark, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import type { DailyVerse } from "@shared/schema";

export default function Devotion() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const { data: verse, isLoading } = useQuery<DailyVerse>({
    queryKey: ["/api/daily-verse", language],
    queryFn: async () => {
      const res = await fetch(`/api/daily-verse?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch daily verse");
      return res.json();
    },
  });

  const handleShare = async () => {
    if (!verse) return;

    const shareText = `"${verse.verse}" - ${verse.reference}\n\n${verse.devotional}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("dailyDevotion"),
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareText);
          toast({
            title: t("verseShared"),
            description: "Copied to clipboard",
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: t("verseShared"),
        description: "Copied to clipboard",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: t("verseSaved"),
      description: verse?.reference || "",
    });
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="px-4 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
          {t("dailyDevotion")}
        </h1>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      <div className="flex-1 px-4 space-y-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {t("todaysVerse")}
                </span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSave}
                  data-testid="button-save"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-4/6" />
                <Skeleton className="h-4 w-1/3 mt-4" />
              </div>
            ) : verse ? (
              <>
                <blockquote className="font-serif text-xl md:text-2xl text-foreground leading-relaxed italic text-center mb-4">
                  "{verse.verse}"
                </blockquote>
                <p 
                  className="text-center text-primary font-semibold"
                  data-testid="text-verse-reference"
                >
                  — {verse.reference}
                </p>
              </>
            ) : (
              <p className="font-serif text-xl text-center italic text-foreground">
                "The Lord is my shepherd; I shall not want."
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-serif font-semibold text-lg text-foreground">
            {t("todaysDevotional")}
          </h2>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : verse ? (
            <p 
              className="text-muted-foreground leading-relaxed"
              data-testid="text-devotional"
            >
              {verse.devotional}
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              God calls us to rest in His care, trusting that He will provide for all our needs. 
              Just as a shepherd leads his flock to green pastures and still waters, our Heavenly 
              Father guides us through every season of life. Today, let go of your worries and 
              place your trust in His unfailing love.
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-serif font-semibold text-lg text-foreground">
            {t("prayerInspired")}
          </h2>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : verse ? (
            <Card className="bg-muted/50">
              <CardContent className="p-5">
                <p 
                  className="text-foreground leading-relaxed italic"
                  data-testid="text-prayer"
                >
                  {verse.prayer}
                </p>
                <p className="text-right font-semibold text-primary mt-4">
                  {t("amen")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-5">
                <p className="text-foreground leading-relaxed italic">
                  Lord, thank You for being my Shepherd. Help me to trust in Your provision 
                  and guidance today. May I find rest in Your presence and peace in Your promises. 
                  Lead me in paths of righteousness for Your name's sake.
                </p>
                <p className="text-right font-semibold text-primary mt-4">
                  {t("amen")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
