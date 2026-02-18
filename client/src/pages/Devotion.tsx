import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Share2, Bookmark, BookOpen, Bell, BellOff, MessageCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import type { DailyVerse } from "@shared/schema";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, isPushSupported } from "@/lib/pushNotifications";

export default function Devotion() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const pushSupported = isPushSupported();

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled);
  }, []);

  const { data: verse, isLoading } = useQuery<DailyVerse>({
    queryKey: ["/api/daily-verse", language],
    queryFn: async () => {
      const res = await fetch(`/api/daily-verse?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch daily verse");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const { data: shareData } = useQuery<{
    whatsappUrl: string;
    facebookUrl: string;
    shareCaption: string;
    reference: string;
    verseExcerpt: string;
    devotionUrl?: string;
  }>({
    queryKey: ["/api/share/today", language],
    queryFn: async () => {
      const res = await fetch(`/api/share/today?language=${language}`);
      if (!res.ok) throw new Error("Failed to fetch share data");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

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

  const today = new Date().toLocaleDateString(language === "fr" ? "fr-FR" : language === "ht" ? "fr-HT" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
              {t("dailyDevotion")}
            </h1>
            <p className="text-muted-foreground text-sm capitalize">{today}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePush}
            disabled={pushLoading}
            data-testid="button-toggle-notifications"
          >
            {pushEnabled ? (
              <BellOff className="w-4 h-4 mr-2" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            {pushEnabled ? t("disableNotifications") : t("enableNotifications")}
          </Button>
        </div>
      </div>

      <div className="flex-1 px-5 space-y-6">
        <Card className="shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-[#0A1F44]/5 dark:bg-[#D4AF37]/5 px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-xs font-semibold text-[#0A1F44] dark:text-[#D4AF37] uppercase tracking-widest">
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
                  <blockquote className="font-serif text-xl text-foreground leading-relaxed italic text-center mb-4">
                    &laquo; {verse.verse} &raquo;
                  </blockquote>
                  <p 
                    className="text-center text-[#D4AF37] font-semibold"
                    data-testid="text-verse-reference"
                  >
                    — {verse.reference}
                  </p>
                </>
              ) : (
                <p className="font-serif text-xl text-center italic text-foreground">
                  &laquo; The Lord is my shepherd; I shall not want. &raquo;
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-serif font-semibold text-xl text-foreground">
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
              className="text-muted-foreground leading-relaxed text-base"
              data-testid="text-devotional"
            >
              {verse.devotional}
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              God calls us to rest in His care, trusting that He will provide for all our needs.
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-serif font-semibold text-xl text-foreground">
            {t("prayerInspired")}
          </h2>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : verse ? (
            <Card className="bg-[#0A1F44]/5 dark:bg-[#D4AF37]/5 shadow-sm">
              <CardContent className="p-5">
                <p 
                  className="text-foreground leading-relaxed italic"
                  data-testid="text-prayer"
                >
                  {verse.prayer}
                </p>
                <p className="text-right font-serif font-semibold text-[#D4AF37] mt-4">
                  {t("amen")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#0A1F44]/5 dark:bg-[#D4AF37]/5 shadow-sm">
              <CardContent className="p-5">
                <p className="text-foreground leading-relaxed italic">
                  Lord, thank You for being my Shepherd. Help me to trust in Your provision.
                </p>
                <p className="text-right font-serif font-semibold text-[#D4AF37] mt-4">
                  {t("amen")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <div className="space-y-3 pb-4">
          <h2 className="font-serif font-semibold text-xl text-foreground">
            {t("shareThisDevotion")}
          </h2>
          <div className="flex gap-3 flex-wrap">
            {shareData && (
              <Button
                variant="outline"
                onClick={() => window.open(shareData.whatsappUrl, "_blank")}
                data-testid="button-share-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleShare}
              data-testid="button-share-general"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t("share")}
            </Button>
          </div>
          {shareData && (
            <Card className="bg-muted/30 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t("copyShareMessage")}:</p>
                <p className="text-sm text-foreground whitespace-pre-line" data-testid="text-share-caption">
                  {shareData.shareCaption}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareData.shareCaption);
                    toast({ title: t("copiedToClipboard") });
                  }}
                  data-testid="button-copy-caption"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {t("copyText")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
