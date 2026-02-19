import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, User, Crown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import type { Language } from "@shared/schema";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "EN" },
  { code: "fr", name: "Français", flag: "FR" },
  { code: "ht", name: "Kreyòl Ayisyen", flag: "HT" },
];

const navLinks = [
  { path: "/music", labelKey: "music", anchor: "#listen" },
  { path: "/devotion", labelKey: "devotion", anchor: "#verse" },
  { path: "/prayer", labelKey: "prayer", anchor: "#prayer" },
  { path: "/support", labelKey: "support", anchor: "#premium" },
];

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === language);
  const isHome = location === "/";

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md hidden md:block"
      data-testid="nav-top"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home-logo">
            <img
              src={logoImage}
              alt="Bénédictions Partagées"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">{t("appName")}</div>
              <div className="text-xs text-muted-foreground">Worship &middot; Word &middot; Prayer</div>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <span
                  className={`text-sm cursor-pointer transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`topnav-${item.labelKey}`}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-topnav-language">
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
                  data-testid={`topnav-language-${lang.code}`}
                >
                  <span className="mr-2 text-xs font-bold text-muted-foreground">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-topnav-theme">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          {user ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm" data-testid="button-topnav-account" className="relative">
                <User className="w-4 h-4 mr-1" />
                {t("home")}
                {user.isPremium && (
                  <Crown className="w-3 h-3 ml-1 text-[#D4AF37]" />
                )}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" data-testid="button-topnav-signin">
                {t("welcome")}
              </Button>
            </Link>
          )}

          <Link href="/music">
            <Button size="sm" data-testid="button-topnav-start-listening">
              {t("play")} &middot; {t("music")}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
