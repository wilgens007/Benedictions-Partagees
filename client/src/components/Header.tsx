import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@shared/schema";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "EN" },
  { code: "fr", name: "Français", flag: "FR" },
  { code: "ht", name: "Kreyòl Ayisyen", flag: "HT" },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  return (
    <header className="sticky top-0 z-40 bg-[#0A1F44] dark:bg-[#060E22]">
      <div className="flex items-center justify-between gap-4 px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <img 
            src={logoImage} 
            alt="Bénédictions Partagées" 
            className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/30"
          />
          <span className="font-serif font-semibold text-base text-white tracking-wide hidden min-[360px]:block">
            {t("appName")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white/90 no-default-hover-elevate no-default-active-elevate"
                data-testid="button-language"
              >
                <Globe className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">{currentLang?.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? "bg-primary/10 text-primary font-medium" : ""}
                  data-testid={`language-${lang.code}`}
                >
                  <span className="mr-2 text-xs font-bold text-muted-foreground">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="text-white/90 no-default-hover-elevate no-default-active-elevate"
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
