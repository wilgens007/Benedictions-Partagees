import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Shield, AlertTriangle, LogIn, CheckCircle, Clock, Eye } from "lucide-react";

export default function DeleteAccount() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loggedIn = !!user || isAuthenticated;

  const handleLoginForDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsAuthenticated(true);
    } catch (error: any) {
      setLoginError(error.message || "Invalid email or password");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", "/api/auth/account");
      queryClient.clear();
      setDeleteDialogOpen(false);
      setLocation("/");
      toast({
        title: t("accountDeleted") || "Account Deleted",
        description: t("accountDeletedDesc") || "Your account and all associated data have been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" data-testid="page-delete-account">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-red-500" />
          <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-delete-title">
            Account Deletion
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg font-medium" data-testid="text-delete-org">
          B&eacute;n&eacute;dictions Partag&eacute;es
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1" data-testid="text-delete-subtitle">
          Christian Gospel Podcast App
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 space-y-5">
        <Card data-testid="card-how-to-delete">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg" data-testid="text-steps-title">
              How to Delete Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Follow these steps to permanently delete your B&eacute;n&eacute;dictions Partag&eacute;es account and all associated data:
            </p>
            <div className="space-y-3">
              <div className="flex gap-3" data-testid="step-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sign in to your account</p>
                  <p className="text-xs text-muted-foreground">Use your email and password below, or open the app and go to your Dashboard.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="step-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Click "Delete My Account"</p>
                  <p className="text-xs text-muted-foreground">You will see a confirmation dialog before any data is removed.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="step-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Type "DELETE" to confirm</p>
                  <p className="text-xs text-muted-foreground">This safety step prevents accidental deletions.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="step-4">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Account and data are permanently removed</p>
                  <p className="text-xs text-muted-foreground">Deletion is immediate. You will be signed out automatically.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-data-details">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg">
              What Happens to Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Permanently Deleted</p>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-1 ml-4 list-disc">
                    <li>Account profile (email, username, encrypted password)</li>
                    <li>All saved Bible verses</li>
                    <li>Custom playlists and playlist contents</li>
                    <li>Prayer reactions and comments</li>
                    <li>Content reports you submitted</li>
                    <li>Login sessions and password reset tokens</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Anonymized (Not Deleted)</p>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-1 ml-4 list-disc">
                    <li>Prayer requests you posted — your name and account link are removed, but the prayer text may remain visible on the prayer wall as an anonymous post</li>
                    <li>Song play history — your user link is removed; play counts are kept as anonymous aggregate statistics</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Subscription Cancelled</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    If you have an active premium subscription through Stripe (web), it will be automatically cancelled. For Google Play subscriptions, the subscription will stop renewing but you should also cancel it in the Google Play Store app to avoid future charges.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Retention Period</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deletion is immediate and permanent. There is no additional retention period. Once confirmed, your data cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card className="border-red-500/20" data-testid="card-delete-action-area">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Delete Your Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!loggedIn ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in with your B&eacute;n&eacute;dictions Partag&eacute;es account to proceed with deletion.
                </p>
                <form onSubmit={handleLoginForDeletion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-email">{t("email") || "Email"}</Label>
                    <Input
                      id="delete-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      data-testid="input-delete-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">{t("password") || "Password"}</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-delete-password"
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-red-500" data-testid="text-login-error">{loginError}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoggingIn}
                    data-testid="button-login-for-deletion"
                  >
                    {isLoggingIn ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t("signingIn") || "Signing in..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        Sign In to Continue
                      </span>
                    )}
                  </Button>
                  <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-[#D4AF37]" data-testid="link-forgot-password">
                      {t("forgotPassword") || "Forgot password?"}
                    </Link>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Signed in as: <span className="font-medium text-foreground">{user?.email || email}</span>
                </p>

                <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) setDeleteConfirmText("");
                }}>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-my-account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-500" data-testid="text-delete-dialog-title">
                        {t("deleteAccountTitle") || "Delete Your Account?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-3">
                          <p>This will permanently delete your B&eacute;n&eacute;dictions Partag&eacute;es account and all associated data. This action cannot be undone.</p>
                          <p className="font-medium">Type "DELETE" to confirm:</p>
                          <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="font-mono"
                            data-testid="input-delete-confirm"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-delete-cancel">
                        {t("cancel") || "Cancel"}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || isDeleting}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        data-testid="button-delete-confirm"
                      >
                        {isDeleting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {t("deleting") || "Deleting..."}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            {t("deleteAccountConfirm") || "Delete Account"}
                          </span>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Need help or have questions about your data?
            </p>
            <a href="mailto:contact@benedictionspartagees.org" className="text-sm text-[#D4AF37] font-medium" data-testid="link-contact-email">
              contact@benedictionspartagees.org
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
