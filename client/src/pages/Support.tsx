import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, DollarSign, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest } from "@/lib/queryClient";

const presetAmounts = [
  { amount: 5, label: "$5" },
  { amount: 10, label: "$10" },
  { amount: 25, label: "$25" },
  { amount: 50, label: "$50" },
];

export default function Support() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: config } = useQuery<Record<string, string>>({
    queryKey: ["/api/support/config"],
    queryFn: async () => {
      const res = await fetch("/api/support/config");
      if (!res.ok) return {};
      return res.json();
    },
  });

  const cashAppHandle = config?.cashapp_handle || "";
  const zelleHandle = config?.zelle_handle || "";
  const paypalHandle = config?.paypal_handle || "";
  const contactEmail = config?.contact_email || "contact@benedictionspartagees.org";
  const hasAltPayments = cashAppHandle || zelleHandle || paypalHandle;

  const handleDonate = async () => {
    const donationAmount = isCustom ? parseFloat(customAmount) : selectedAmount;

    if (!donationAmount || donationAmount < 1) {
      toast({
        title: t("error") || "Error",
        description: t("minimumDonation") || "Minimum donation is $1.00",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const body = isCustom ? { customAmount: customAmount } : { amount: donationAmount };
      const res = await apiRequest("POST", "/api/support/create-donation-session", body);
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error.message || "Could not start donation process",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const selectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const selectCustom = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const hasSelection = isCustom ? parseFloat(customAmount) >= 1 : selectedAmount !== null;

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-support-title">
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

        <div className="space-y-4">
          <h2 className="font-serif font-semibold text-xl text-foreground">
            {t("makeADonation")}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {presetAmounts.map((item) => (
              <Button
                key={item.amount}
                variant={selectedAmount === item.amount && !isCustom ? "default" : "outline"}
                className={`h-14 text-lg font-semibold ${
                  selectedAmount === item.amount && !isCustom
                    ? "bg-[#0A1F44] text-white border-[#0A1F44] dark:bg-[#D4AF37] dark:text-[#0A1F44] dark:border-[#D4AF37]"
                    : ""
                }`}
                onClick={() => selectPreset(item.amount)}
                disabled={isProcessing}
                data-testid={`button-donate-${item.amount}`}
              >
                <DollarSign className="w-5 h-5 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Button
              variant={isCustom ? "default" : "outline"}
              className={`w-full ${
                isCustom
                  ? "bg-[#0A1F44] text-white border-[#0A1F44] dark:bg-[#D4AF37] dark:text-[#0A1F44] dark:border-[#D4AF37]"
                  : ""
              }`}
              onClick={selectCustom}
              disabled={isProcessing}
              data-testid="button-donate-custom-toggle"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {t("customAmount")}
            </Button>

            {isCustom && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">$</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="text-lg"
                  autoFocus
                  data-testid="input-custom-amount"
                />
              </div>
            )}
          </div>

          <Button
            className="w-full h-12 bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold text-base"
            onClick={handleDonate}
            disabled={!hasSelection || isProcessing}
            data-testid="button-donate-submit"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("redirecting") || "Redirecting..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                {t("donateNow") || "Donate Now"}
                {!isCustom && selectedAmount ? ` — $${selectedAmount}` : ""}
                {isCustom && customAmount ? ` — $${customAmount}` : ""}
              </span>
            )}
          </Button>
        </div>

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
