import { Heart, ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export default function ThankYou() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-full items-center justify-center px-5">
      <Card className="max-w-md w-full shadow-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-[#D4AF37]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {t("thankYou")}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {t("thankYouMessage")}
            </p>
          </div>

          <p className="text-sm text-muted-foreground italic">
            {t("thankYouVerse")}
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/devotion">
              <Button variant="default" className="w-full" data-testid="button-read-devotion">
                <BookOpen className="w-4 h-4 mr-2" />
                {t("readTodaysDevotion")}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
