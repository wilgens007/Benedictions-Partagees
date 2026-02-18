import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi, clearAdminToken, getAdminToken } from "@/lib/adminAuth";
import { LayoutDashboard, Music, MessageSquareText, HandHeart, Users, LogOut, Menu, X } from "lucide-react";

interface AdminStats {
  songs: number;
  albums: number;
  testimonies: number;
  pendingTestimonies: number;
  prayerRequests: number;
  pendingPrayers: number;
  users: number;
}

function AdminSidebar({ active, onNav, mobile, open, onClose }: { active: string; onNav: (p: string) => void; mobile: boolean; open: boolean; onClose: () => void }) {
  const items = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, path: "/admin" },
    { key: "music", label: "Music", icon: Music, path: "/admin/music" },
    { key: "testimonies", label: "Testimonies", icon: MessageSquareText, path: "/admin/testimonies" },
    { key: "prayers", label: "Prayer Requests", icon: HandHeart, path: "/admin/prayers" },
    { key: "users", label: "Users", icon: Users, path: "/admin/users" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <span className="font-bold text-white text-lg">BP Admin</span>
        {mobile && (
          <Button size="icon" variant="ghost" className="ml-auto text-white" onClick={onClose} data-testid="button-close-sidebar">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => { onNav(item.path); if (mobile) onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              active === item.key
                ? "text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            style={active === item.key ? { background: "rgba(212, 175, 55, 0.3)", borderLeft: "3px solid #D4AF37" } : {}}
            data-testid={`nav-admin-${item.key}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-2 mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => { clearAdminToken(); window.location.href = "/admin/login"; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10"
          data-testid="button-admin-logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  if (mobile) {
    if (!open) return null;
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <aside className="fixed left-0 top-0 bottom-0 w-64 z-50" style={{ background: "#0A1F44" }}>
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 flex-col" style={{ background: "#0A1F44" }}>
      {sidebarContent}
    </aside>
  );
}

function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => { adminApi<AdminStats>("/api/admin/stats").then(setStats).catch(() => {}); }, []);

  if (!stats) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;

  const cards = [
    { label: "Albums", value: stats.albums, color: "#0A1F44" },
    { label: "Songs", value: stats.songs, color: "#1a3a6e" },
    { label: "Testimonies", value: stats.testimonies, sub: `${stats.pendingTestimonies} pending`, color: "#D4AF37" },
    { label: "Prayer Requests", value: stats.prayerRequests, sub: `${stats.pendingPrayers} pending`, color: "#2d6a4f" },
    { label: "Users", value: stats.users, color: "#6d28d9" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-admin-overview-title">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: c.color }} data-testid={`stat-${c.label.toLowerCase().replace(/\s/g, "-")}`}>{c.value}</p>
              {c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { AdminSidebar, OverviewPage };
