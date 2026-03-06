import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, Shield, AlertTriangle, LogIn } from "lucide-react";

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
            {t("deleteAccount") || "Delete Account"}
          </h1>
        </div>
        <p className="text-muted-foreground mt-2" data-testid="text-delete-org">
          B&eacute;n&eacute;dictions Partag&eacute;es
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 space-y-5">
        <Card className="border-red-500/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium" data-testid="text-delete-warning">
                  {t("deleteAccountWarning") || "This action is permanent and cannot be undone. The following data will be permanently deleted:"}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>{t("deleteItemProfile") || "Your profile and login credentials"}</li>
                  <li>{t("deleteItemVerses") || "All saved verses"}</li>
                  <li>{t("deleteItemPlaylists") || "Your playlists"}</li>
                  <li>{t("deleteItemPrayer") || "Prayer reactions and comments"}</li>
                  <li>{t("deleteItemSubscription") || "Premium subscription (will be cancelled)"}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {!loggedIn ? (
          <Card data-testid="card-login-for-deletion">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <LogIn className="w-5 h-5 text-muted-foreground" />
                {t("loginToDelete") || "Sign in to delete your account"}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    t("signIn") || "Sign In"
                  )}
                </Button>
                <div className="text-center">
                  <Link href="/forgot-password" className="text-sm text-[#D4AF37]" data-testid="link-forgot-password">
                    {t("forgotPassword") || "Forgot password?"}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="card-delete-action">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                {t("confirmDeletion") || "Confirm Account Deletion"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("loggedInAs") || "Logged in as"}: <span className="font-medium text-foreground">{user?.email || email}</span>
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
                  {t("deleteMyAccount") || "Delete My Account"}
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-500" data-testid="text-delete-dialog-title">
                      {t("deleteAccountTitle") || "Delete Your Account?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>{t("finalDeleteWarning") || "This will permanently delete your account and all data. This cannot be undone."}</p>
                        <p className="font-medium">{t("deleteConfirmPrompt") || 'Type "DELETE" to confirm:'}</p>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {t("needHelp") || "Need help?"}{" "}
              <a href="mailto:contact@benedictionspartagees.org" className="text-[#D4AF37] font-medium" data-testid="link-contact-email">
                contact@benedictionspartagees.org
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
