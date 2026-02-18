import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check, BookOpen, Music, ListMusic, Heart, Sparkles } from "lucide-react";

interface PriceItem {
  id: string;
  nickname?: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
  };
}

const freeFeatures = [
  { icon: BookOpen, label: "Daily devotionals" },
  { icon: Heart, label: "20 saved verses" },
  { icon: Sparkles, label: "Community prayers" },
];

const premiumFeatures = [
  { icon: Check, label: "All free features" },
  { icon: Heart, label: "Unlimited saved verses" },
  { icon: Music, label: "Early access music" },
  { icon: ListMusic, label: "Custom playlists" },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: pricesData, isLoading } = useQuery<{ prices: PriceItem[] }>({
    queryKey: ["/api/billing/prices"],
  });

  const prices = pricesData?.prices || [];
  const monthlyPrice = prices.find((p) => p.recurring?.interval === "month");
  const yearlyPrice = prices.find((p) => p.recurring?.interval === "year");
  const selectedPrice = isYearly ? yearlyPrice : monthlyPrice;

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const handleSubscribe = async () => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (!selectedPrice) {
      toast({ title: "No price selected", variant: "destructive" });
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await apiRequest("POST", "/api/billing/create-checkout-session", {
        priceId: selectedPrice.id,
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Could not start checkout",
        variant: "destructive",
      });
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040] px-5 pt-8 pb-14">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-7 h-7 text-[#D4AF37]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-2" data-testid="text-pricing-title">
            Choose Your Plan
          </h1>
          <p className="text-white/60 text-sm">Unlock the full spiritual experience</p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 space-y-5 pb-8">
        <div className="flex items-center justify-center gap-3" data-testid="toggle-billing-period">
          <Label className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </Label>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            data-testid="switch-billing-period"
          />
          <Label className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </Label>
          {isYearly && (
            <Badge variant="secondary" className="text-xs bg-[#D4AF37]/15 text-[#D4AF37]" data-testid="badge-save">
              Save 16%
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="shadow-md" data-testid="card-free-tier">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2 flex-wrap">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  Free
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground text-sm ml-1">/forever</span>
                </div>
                <ul className="space-y-3">
                  {freeFeatures.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0A1F44]/8 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#0A1F44] dark:text-white" />
                      </div>
                      <span className="text-sm text-foreground">{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {user ? (
                  <Button variant="outline" className="w-full" disabled data-testid="button-free-current">
                    Current Plan
                  </Button>
                ) : (
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full" data-testid="button-free-signup">
                      Get Started
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>

            <Card
              className="shadow-lg border-[#D4AF37]/40"
              data-testid="card-premium-tier"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="font-serif text-lg flex items-center gap-2 flex-wrap">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                    Premium
                  </CardTitle>
                  <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]" data-testid="badge-premium">
                    Most Popular
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="mb-4">
                  {isYearly ? (
                    <>
                      <span className="text-3xl font-bold text-foreground" data-testid="text-price">
                        {yearlyPrice ? formatPrice(yearlyPrice.unit_amount) : "$49.99"}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/year</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-foreground" data-testid="text-price">
                        {monthlyPrice ? formatPrice(monthlyPrice.unit_amount) : "$4.99"}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/month</span>
                    </>
                  )}
                </div>
                <ul className="space-y-3">
                  {premiumFeatures.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#D4AF37]" />
                      </div>
                      <span className="text-sm text-foreground">{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]"
                  onClick={handleSubscribe}
                  disabled={isCheckingOut}
                  data-testid="button-subscribe"
                >
                  {isCheckingOut ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Subscribe Now
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed" data-testid="text-pricing-disclaimer">
          Cancel anytime. Secure payment powered by Stripe.
        </p>
      </div>
    </div>
  );
}
