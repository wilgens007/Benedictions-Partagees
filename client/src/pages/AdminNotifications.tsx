import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Send, Bell, Music, Megaphone, Sparkles } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  url: string | null;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  new_song: "New Song",
  update: "Update",
  feature: "Feature",
};

function TypeBadge({ type }: { type: string }) {
  const icons: Record<string, typeof Music> = { new_song: Music, update: Megaphone, feature: Sparkles };
  const colors: Record<string, string> = { new_song: "#2d6a4f", update: "#0A1F44", feature: "#D4AF37" };
  const Icon = icons[type] || Megaphone;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ background: colors[type] || "#555" }}
      data-testid={`badge-type-${type}`}
    >
      <Icon className="w-3 h-3" />
      {typeLabels[type] || type}
    </span>
  );
}

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("update");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Announcement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { toast } = useToast();

  const fetchHistory = () => {
    adminApi<Announcement[]>("/api/admin/notifications")
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Validation Error", description: "Title and body are required.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await adminApi("/api/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          url: url.trim() || undefined,
        }),
      });
      toast({ title: "Notification Sent", description: "Push notification has been sent to all subscribers." });
      setTitle("");
      setBody("");
      setType("update");
      setUrl("");
      fetchHistory();
    } catch (err: any) {
      toast({ title: "Failed to Send", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Bell className="w-6 h-6" style={{ color: "#D4AF37" }} />
        <h1 className="text-2xl font-bold" data-testid="text-admin-notifications-title">Notifications</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compose Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">Title</Label>
            <Input
              id="notif-title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-notification-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-body">Body</Label>
            <Textarea
              id="notif-body"
              placeholder="Notification message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="resize-none min-h-[100px]"
              data-testid="input-notification-body"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-notification-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_song">New Song</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-url">URL (optional)</Label>
            <Input
              id="notif-url"
              placeholder="/music or https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-notification-url"
            />
            <p className="text-xs text-muted-foreground">Deep link opened when the user taps the notification.</p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full sm:w-auto"
            data-testid="button-send-notification"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Notification
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-notifications">No notifications sent yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 space-y-1"
                  data-testid={`notification-item-${item.id}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={item.type} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium text-sm" data-testid={`text-notification-title-${item.id}`}>{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  {item.url && (
                    <p className="text-xs text-blue-600">{item.url}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
