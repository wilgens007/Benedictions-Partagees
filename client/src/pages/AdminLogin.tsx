import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { setAdminToken } from "@/lib/adminAuth";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      setAdminToken(data.token);
      setLocation("/admin");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0A1F44 0%, #1a3a6e 100%)" }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#D4AF37" }}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl" data-testid="text-admin-login-title">Admin Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">Bénédictions Partagées</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Admin Password</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter admin password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                data-testid="input-admin-secret"
              />
            </div>
            {error && <p className="text-sm text-destructive" data-testid="text-admin-error">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login" style={{ background: "#0A1F44" }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
