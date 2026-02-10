import { useQuery } from "@tanstack/react-query";
import { Heart, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/LanguageContext";

const defaultAmounts = [
  { amount: 5, label: "$5" },
  { amount: 10, label: "$10" },
  { amount: 25, label: "$25" },
  { amount: 50, label: "$50" },
];

export default function Support() {
  const { t } = useLanguage();

  const { data: config } = useQuery<Record<string, string>>({
    queryKey: ["/api/support/config"],
    queryFn: async () => {
      const res = await fetch("/api/support/config");
      if (!res.ok) return {};
      return res.json();
    },
  });

  const stripeLink5 = config?.stripe_link_5 || "";
  const stripeLink10 = config?.stripe_link_10 || "";
  const stripeLink25 = config?.stripe_link_25 || "";
  const stripeLink50 = config?.stripe_link_50 || "";
  const stripeLinkCustom = config?.stripe_link_custom || "";
  const stripeLinkMonthly = config?.stripe_link_monthly || "";
  const cashAppHandle = config?.cashapp_handle || "";
  const zelleHandle = config?.zelle_handle || "";
  const paypalHandle = config?.paypal_handle || "";
  const contactEmail = config?.contact_email || "contact@benedictionspartagees.org";

  const stripeLinks: Record<number, string> = {
    5: stripeLink5,
    10: stripeLink10,
    25: stripeLink25,
    50: stripeLink50,
  };

  const hasStripeLinks = stripeLink5 || stripeLink10 || stripeLink25 || stripeLink50 || stripeLinkCustom;
  const hasAltPayments = cashAppHandle || zelleHandle || paypalHandle;

  const handleDonate = (amount: number) => {
    const link = stripeLinks[amount];
    if (link) {
      window.open(link, "_blank");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          {t("supportMinistry")}
        </h1>
      </div>

      <div className="flex-1 px-5 space-y-6">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("supportMission")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("supportImpact")}
            </p>
          </CardContent>
        </Card>

        {hasStripeLinks ? (
          <div className="space-y-4">
            <h2 className="font-serif font-semibold text-xl text-foreground">
              {t("makeADonation")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {defaultAmounts.map((item) => {
                const link = stripeLinks[item.amount];
                return (
                  <Button
                    key={item.amount}
                    variant="outline"
                    className="h-16 text-lg font-semibold"
                    onClick={() => handleDonate(item.amount)}
                    disabled={!link}
                    data-testid={`button-donate-${item.amount}`}
                  >
                    <DollarSign className="w-5 h-5 mr-1" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            {stripeLinkCustom && (
              <Button
                variant="default"
                className="w-full h-12"
                onClick={() => window.open(stripeLinkCustom, "_blank")}
                data-testid="button-donate-custom"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                {t("customAmount")}
              </Button>
            )}

            {stripeLinkMonthly && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-serif font-semibold text-foreground">
                    {t("monthlySupport")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("monthlyDescription")}
                  </p>
                  <Button
                    variant="default"
                    className="w-full h-12"
                    onClick={() => window.open(stripeLinkMonthly, "_blank")}
                    data-testid="button-donate-monthly"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {t("becomeMonthlySupporter")}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EAB308]/10 flex items-center justify-center">
                <Heart className="w-8 h-8 text-[#EAB308]" />
              </div>
              <h2 className="font-serif font-semibold text-lg text-foreground mb-2">
                {t("donationsComingSoon")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("donationsComingSoonDesc")}
              </p>
            </CardContent>
          </Card>
        )}

        {hasAltPayments && (
          <>
            <Separator />
            <div className="space-y-3">
              <h2 className="font-serif font-semibold text-xl text-foreground">
                {t("otherWaysToGive")}
              </h2>
              {cashAppHandle && (
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground">Cash App</p>
                      <p className="text-sm text-muted-foreground">{cashAppHandle}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://cash.app/${cashAppHandle}`, "_blank")}
                      data-testid="button-cashapp"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t("open")}
                    </Button>
                  </CardContent>
                </Card>
              )}
              {paypalHandle && (
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground">PayPal</p>
                      <p className="text-sm text-muted-foreground">{paypalHandle}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://paypal.me/${paypalHandle}`, "_blank")}
                      data-testid="button-paypal"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t("open")}
                    </Button>
                  </CardContent>
                </Card>
              )}
              {zelleHandle && (
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground">Zelle</p>
                      <p className="text-sm text-muted-foreground">{zelleHandle}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        <Separator />

        <Card className="bg-muted/30 shadow-sm">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t("questionsAboutDonations")}
            </p>
            <a 
              href={`mailto:${contactEmail}`}
              className="text-sm text-primary font-medium"
              data-testid="link-contact-email"
            >
              {contactEmail}
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
