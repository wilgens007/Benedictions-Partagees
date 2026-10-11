import { useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/lib/LanguageContext";

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallAppBanner() {
  const { isInstallable, isInstalled, showIOSInstructions, promptInstall } = usePWAInstall();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !showIOSInstructions) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  };

  const text = {
    title: language === "fr" ? "Installer l'application" : language === "ht" ? "Enstale aplikasyon an" : "Install the App",
    subtitle: language === "fr"
      ? "Ajoutez BP à votre écran d'accueil pour un accès rapide."
      : language === "ht"
        ? "Mete BP sou ekran lakay ou pou aksè rapid."
        : "Add BP to your home screen for quick access.",
    install: language === "fr" ? "Installer" : language === "ht" ? "Enstale" : "Install",
    iosInstructions: language === "fr"
      ? "Appuyez sur Partager puis « Sur l'écran d'accueil »."
      : language === "ht"
        ? "Peze Pataje apre « Sou ekran lakay »."
        : "Tap Share, then “Add to Home Screen.”",
  };

  return (
    <div className="mx-4 mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#D4AF37]/20 shrink-0">
        {showIOSInstructions ? (
          <Share className="w-5 h-5 text-[#D4AF37]" />
        ) : (
          <Download className="w-5 h-5 text-[#D4AF37]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{text.title}</p>
        <p className="text-xs text-muted-foreground">
          {showIOSInstructions ? text.iosInstructions : text.subtitle}
        </p>
      </div>
      {isInstallable && (
        <Button size="sm" onClick={promptInstall} className="shrink-0">
          {text.install}
        </Button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
