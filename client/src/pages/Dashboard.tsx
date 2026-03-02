import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Crown, User, Mail, BookOpen, LogOut, Settings, Sparkles, ChevronRight, Smartphone } from "lucide-react";
import { isAndroidApp } from "@/lib/platform";

interface SavedVersesInfo {
  count: number;
  limit: number | null;
  isPremium: boolean;
  verses: any[];
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isManaging, setIsManaging] = useState(false);

  const { data: versesInfo, isLoading: versesLoading } = useQuery<SavedVersesInfo>({
    queryKey: ["/api/verses/saved"],
    enabled: !!user,
  });

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const res = await apiRequest("POST", "/api/billing/create-portal-session");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not open subscription management",
        variant: "destructive",
      });
      setIsManaging(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch {
      toast({ title: "Error logging out", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading) {
    return (
      <div className="px-5 py-8 space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040] px-5 pt-8 pb-14">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-xl font-bold text-white truncate" data-testid="text-user-name">
                {user.username}
              </h1>
              <p className="text-white/60 text-sm truncate" data-testid="text-user-email">
                {user.email}
              </p>
            </div>
            {user.isPremium && (
              <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] flex-shrink-0" data-testid="badge-premium-status">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 space-y-4 pb-8">
        <Card className="shadow-lg" data-testid="card-subscription-status">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2 flex-wrap">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              {t("subscription") || "Subscription"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.isPremium ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] no-default-hover-elevate no-default-active-elevate" data-testid="badge-plan-active">
                    <Crown className="w-3 h-3 mr-1" />
                    {t("premiumActive") || "Premium Active"}
                  </Badge>
                  {(user as any).premiumSource && (
                    <Badge variant="outline" className="text-xs" data-testid="badge-premium-source">
                      {(user as any).premiumSource === "google" ? (
                        <><Smartphone className="w-3 h-3 mr-1" /> Google Play</>
                      ) : (
                        <>Stripe</>
                      )}
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  {user.premiumSince && (
                    <span className="text-xs text-muted-foreground" data-testid="text-premium-since">
                      Since {new Date(user.premiumSince).toLocaleDateString()}
                    </span>
                  )}
                  {(user as any).premiumExpiresAt && (
                    <span className="text-xs text-muted-foreground" data-testid="text-premium-expires">
                      Expires {new Date((user as any).premiumExpiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {(user as any).premiumSource === "google" ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Smartphone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Manage your subscription in the Google Play Store app.
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={isManaging}
                    data-testid="button-manage-subscription"
                  >
                    {isManaging ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Opening...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        {t("manageSubscription") || "Manage Subscription"}
                      </span>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" data-testid="badge-plan-free">
                    {t("freePlan") || "Free Plan"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("upgradeDescription") || "Upgrade to Premium for unlimited saved verses, early access music, and more."}
                </p>
                <Link href="/pricing">
                  <Button
                    className="w-full bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]"
                    data-testid="button-upgrade"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t("upgradeToPremium") || "Upgrade to Premium"}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Link href="/saved-verses">
          <Card className="shadow-md hover-elevate active-elevate-2 cursor-pointer overflow-visible" data-testid="card-saved-verses">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2 flex-wrap">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                {t("savedVerses") || "Saved Verses"}
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versesLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : versesInfo ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-foreground" data-testid="text-verses-count">
                      {versesInfo.count}
                    </span>
                    <span className="text-sm text-muted-foreground" data-testid="text-verses-limit">
                      / {versesInfo.limit === null ? "Unlimited" : versesInfo.limit}
                    </span>
                  </div>
                  {versesInfo.limit !== null && (
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37] rounded-full transition-all"
                        style={{ width: `${Math.min((versesInfo.count / (versesInfo.limit || 20)) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-verses-count">0 saved</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Card className="shadow-md" data-testid="card-account-info">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2 flex-wrap">
              <User className="w-5 h-5 text-muted-foreground" />
              {t("account") || "Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground" data-testid="text-account-name">{user.username}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate" data-testid="text-account-email">{user.email}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("signOut") || "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
