import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HandHeart, Send, Check, MessageCircle, Flag, ChevronDown, ChevronUp, Heart, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface PrayerWallRequest {
  id: string;
  displayName: string;
  message: string;
  category: string | null;
  prayedCount: number;
  amenCount: number;
  commentCount: number;
  createdAt: string;
  userReactions: string[];
}

interface PrayerWallComment {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
}

const submitFormSchema = z.object({
  message: z.string().min(1, "Prayer request is required").max(500, "Must be under 500 characters"),
  displayMode: z.enum(["full_name", "first_name", "anonymous"]),
  category: z.string().optional(),
});

type SubmitFormData = z.infer<typeof submitFormSchema>;

const CATEGORIES = ["health", "family", "finances", "guidance", "thanksgiving", "other"];

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function PrayerCard({ request }: { request: PrayerWallRequest }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const hasPrayed = request.userReactions.includes("PRAYED");
  const hasAmen = request.userReactions.includes("AMEN");

  const { data: comments, refetch: refetchComments } = useQuery<PrayerWallComment[]>({
    queryKey: ["/api/prayer-wall/requests", request.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/prayer-wall/requests/${request.id}/comments`);
      return res.json();
    },
    enabled: showComments,
  });

  const reactMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", `/api/prayer-wall/requests/${request.id}/react`, { type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-wall/requests"] });
    },
    onError: () => {
      toast({ title: t("signInToReact"), variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/prayer-wall/requests/${request.id}/comments`, { message });
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-wall/requests"] });
      toast({ title: t("commentPosted") });
    },
    onError: (err: any) => {
      toast({ title: err?.message || t("error"), variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/prayer-wall/report", {
        targetType: "REQUEST",
        targetId: request.id,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("reportSubmitted") });
    },
  });

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (trimmed.length > 220) {
      toast({ title: t("commentTooLong"), variant: "destructive" });
      return;
    }
    commentMutation.mutate(trimmed);
  };

  return (
    <Card className="shadow-sm" data-testid={`card-prayer-request-${request.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground" data-testid="text-prayer-display-name">
              {request.displayName}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo(request.createdAt)}</span>
            {request.category && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-prayer-category">
                {t(`category_${request.category}`) || request.category}
              </Badge>
            )}
          </div>
          {user && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
              data-testid="button-report-prayer"
            >
              <Flag className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-3" data-testid="text-prayer-message">
          {request.message}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={hasPrayed ? "default" : "outline"}
            onClick={() => reactMutation.mutate("PRAYED")}
            disabled={!user || reactMutation.isPending}
            className={hasPrayed ? "bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]" : ""}
            data-testid="button-prayed"
          >
            <HandHeart className="w-3.5 h-3.5 mr-1" />
            {t("iPrayed")} {request.prayedCount > 0 && `(${request.prayedCount})`}
          </Button>

          <Button
            size="sm"
            variant={hasAmen ? "default" : "outline"}
            onClick={() => reactMutation.mutate("AMEN")}
            disabled={!user || reactMutation.isPending}
            className={hasAmen ? "bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]" : ""}
            data-testid="button-amen"
          >
            <Heart className="w-3.5 h-3.5 mr-1" />
            {t("amen")} {request.amenCount > 0 && `(${request.amenCount})`}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowComments(!showComments)}
            data-testid="button-toggle-comments"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            {request.commentCount > 0 ? `${request.commentCount}` : t("encourage")}
            {showComments ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t border-border/50">
            {comments && comments.length > 0 ? (
              <div className="space-y-2 mb-3">
                {comments.map((c) => (
                  <div key={c.id} className="text-sm" data-testid={`comment-${c.id}`}>
                    <span className="font-medium text-foreground">{c.displayName}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">{timeAgo(c.createdAt)}</span>
                    <p className="text-muted-foreground mt-0.5">{c.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">{t("noCommentsYet")}</p>
            )}

            {user ? (
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("writeEncouragement")}
                  maxLength={220}
                  className="text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
                  data-testid="input-comment"
                />
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]"
                  data-testid="button-submit-comment"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline" className="w-full" data-testid="button-sign-in-to-encourage">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  {t("signInToEncourage")}
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Prayer() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: requests, isLoading } = useQuery<PrayerWallRequest[]>({
    queryKey: ["/api/prayer-wall/requests"],
  });

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      message: "",
      displayMode: "first_name",
      category: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitFormData) => {
      const res = await apiRequest("POST", "/api/prayer-wall/requests", {
        ...data,
        language,
      });
      return res.json();
    },
    onSuccess: () => {
      setShowSubmitDialog(false);
      setShowSuccess(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-wall/requests"] });
    },
    onError: (err: any) => {
      toast({ title: err?.message || t("error"), variant: "destructive" });
    },
  });

  const onSubmit = (data: SubmitFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
            <HandHeart className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-prayer-wall-title">
              {t("prayerWall")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("prayerWallDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 mb-4">
        {user ? (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            className="w-full bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold"
            data-testid="button-submit-prayer-request"
          >
            <HandHeart className="w-4 h-4 mr-2" />
            {t("submitAPrayer")}
          </Button>
        ) : (
          <Link href="/login">
            <Button variant="outline" className="w-full" data-testid="button-login-to-submit">
              <LogIn className="w-4 h-4 mr-2" />
              {t("signInToSubmitPrayer")}
            </Button>
          </Link>
        )}
      </div>

      <div className="flex-1 px-5 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-8 bg-muted rounded w-20" />
                      <div className="h-8 bg-muted rounded w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((r) => (
              <PrayerCard key={r.id} request={r} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <HandHeart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm" data-testid="text-empty-prayer-wall">
              {t("noPrayerRequestsYet")}
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 text-center">
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          &laquo; Do not be anxious about anything, but in every situation, by prayer and petition,
          with thanksgiving, present your requests to God. &raquo;
        </p>
        <p className="text-sm text-[#D4AF37] font-serif font-medium mt-2">
          — Philippians 4:6
        </p>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{t("submitAPrayer")}</DialogTitle>
            <DialogDescription>{t("prayerWallDesc")}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("yourPrayer")} *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("prayerPlaceholder")}
                        className="min-h-[120px] resize-none"
                        maxLength={500}
                        {...field}
                        data-testid="textarea-prayer-wall"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground text-right">{field.value.length}/500</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("categoryLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-prayer-category">
                          <SelectValue placeholder={t("selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {t(`category_${cat}`) || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("privacyLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-display-mode">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_name">{t("displayFullName")}</SelectItem>
                        <SelectItem value="first_name">{t("displayFirstName")}</SelectItem>
                        <SelectItem value="anonymous">{t("displayAnonymous")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37]"
                disabled={submitMutation.isPending}
                data-testid="button-submit-prayer-form"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("loading")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t("submit")}
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 mx-auto">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="font-serif text-xl">
              {t("prayerSubmitted")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("prayerSubmittedForReview")}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowSuccess(false)}
            className="w-full mt-4"
            data-testid="button-close-success"
          >
            {t("amen")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
