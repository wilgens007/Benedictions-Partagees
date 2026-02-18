import { useState, useEffect } from "react";
import { useLocation, Switch, Route } from "wouter";
import { getAdminToken, adminApi } from "@/lib/adminAuth";
import { AdminSidebar, OverviewPage } from "./AdminDashboard";
import AdminMusic from "./AdminMusic";
import AdminTestimonies from "./AdminTestimonies";
import AdminPrayers from "./AdminPrayers";
import AdminUsers from "./AdminUsers";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function getActiveKey(path: string): string {
  if (path.startsWith("/music")) return "music";
  if (path.startsWith("/testimonies")) return "testimonies";
  if (path.startsWith("/prayers")) return "prayers";
  if (path.startsWith("/users")) return "users";
  return "overview";
}

export default function AdminLayout() {
  const [location, setLocation] = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const active = getActiveKey(location);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    adminApi("/api/admin/me")
      .then(() => setAuthenticated(true))
      .catch(() => { window.location.href = "/admin/login"; });
  }, []);

  if (authenticated === null) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        active={active}
        onNav={setLocation}
        mobile={true}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <AdminSidebar
        active={active}
        onNav={setLocation}
        mobile={false}
        open={true}
        onClose={() => {}}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-30">
          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setSidebarOpen(true)} data-testid="button-admin-menu">
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold" style={{ color: "#0A1F44" }}>Bénédictions Partagées</h2>
          <div className="ml-auto">
            <span className="text-xs text-muted-foreground hidden sm:inline">Admin Panel</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/music" component={AdminMusic} />
            <Route path="/testimonies" component={AdminTestimonies} />
            <Route path="/prayers" component={AdminPrayers} />
            <Route path="/users" component={AdminUsers} />
            <Route path="/" component={OverviewPage} />
          </Switch>
        </main>
      </div>
    </div>
  );
}
