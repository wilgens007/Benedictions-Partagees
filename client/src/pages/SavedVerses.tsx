import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Trash2, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SavedVerse {
  id: string;
  userId: string;
  reference: string;
  verseText: string;
  savedAt: string;
}

interface SavedVersesResponse {
  verses: SavedVerse[];
  count: number;
  limit: number | null;
  isPremium: boolean;
}

export default function SavedVerses() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<SavedVersesResponse>({
    queryKey: ["/api/verses/saved"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/verses/saved/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete verse");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verses/saved"] });
      toast({ title: t("verseRemoved") || "Verse removed" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Error", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-full py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 py-20 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          {t("signInToSeeVerses") || "Sign in to see your saved verses"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t("signInToSeeVersesDesc") || "Create an account to save and revisit your favorite verses anytime."}
        </p>
        <Link href="/login">
          <Button data-testid="button-login-prompt">
            {t("signIn") || "Sign In"}
          </Button>
        </Link>
      </div>
    );
  }

  const verses = data?.verses || [];
  const limit = data?.limit;
  const isPremium = data?.isPremium || false;

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="flex-shrink-0" data-testid="button-back-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-saved-verses-title">
            {t("savedVerses") || "Saved Verses"}
          </h1>
        </div>

        <div className="flex items-center gap-2 ml-12 flex-wrap">
          <span className="text-sm text-muted-foreground" data-testid="text-verses-count-info">
            {verses.length}{limit !== null ? ` / ${limit}` : ""} {t("saved") || "saved"}
          </span>
          {isPremium ? (
            <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-[10px]" data-testid="badge-premium">
              <Crown className="w-2.5 h-2.5 mr-0.5" />
              Premium
            </Badge>
          ) : limit !== null ? (
            <Badge variant="secondary" className="text-[10px]" data-testid="badge-free-limit">
              {t("freeLimit") || "Free limit"}: {limit}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex-1 px-5 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                  <Skeleton className="h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : verses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
              {t("noSavedVerses") || "No saved verses yet"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {t("noSavedVersesDesc") || "Visit the daily devotion page to save your favorite verses."}
            </p>
            <Link href="/devotion">
              <Button variant="outline" data-testid="button-go-devotion">
                <BookOpen className="w-4 h-4 mr-2" />
                {t("goToDevotion") || "Go to Devotion"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {verses.map((verse) => (
              <Card key={verse.id} className="shadow-sm" data-testid={`card-verse-${verse.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-foreground leading-relaxed italic mb-2" data-testid={`text-verse-${verse.id}`}>
                        &laquo; {verse.verseText} &raquo;
                      </p>
                      <p className="text-sm font-semibold text-[#D4AF37]" data-testid={`text-ref-${verse.id}`}>
                        {verse.reference}
                      </p>
                      {verse.savedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(verse.savedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-muted-foreground"
                      onClick={() => deleteMutation.mutate(verse.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-verse-${verse.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isPremium && limit != null && verses.length >= limit && (
          <Card className="mt-4 shadow-md border-[#D4AF37]/20">
            <CardContent className="p-5 text-center">
              <Crown className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <h3 className="font-serif font-semibold text-foreground mb-1">
                {t("verseLimitReached") || "Verse limit reached"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("upgradeForUnlimited") || "Upgrade to Premium for unlimited saved verses."}
              </p>
              <Link href="/pricing">
                <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]" data-testid="button-upgrade-from-verses">
                  <Crown className="w-4 h-4 mr-2" />
                  {t("upgradeToPremium") || "Upgrade to Premium"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
