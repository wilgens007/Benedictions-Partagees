import { Link, useLocation } from "wouter";
import { Home, Music, Video, BookOpen, HandHeart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const navItems = [
  { path: "/", icon: Home, labelKey: "home" },
  { path: "/music", icon: Music, labelKey: "music" },
  { path: "/videos", icon: Video, labelKey: "videos" },
  { path: "/devotion", icon: BookOpen, labelKey: "devotion" },
  { path: "/prayer", icon: HandHeart, labelKey: "prayer" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 safe-area-bottom"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover-elevate active-elevate-2"
                }`}
                data-testid={`nav-${item.labelKey}`}
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-wide ${
                  isActive ? "text-primary" : ""
                }`}>
                  {t(item.labelKey)}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
