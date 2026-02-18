import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi } from "@/lib/adminAuth";
import { Check, X, Trash2, Eye } from "lucide-react";
import type { DbPrayerRequest } from "@shared/schema";

export default function AdminPrayers() {
  const [items, setItems] = useState<DbPrayerRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<DbPrayerRequest | null>(null);

  const load = () => {
    const url = filter === "all" ? "/api/admin/prayer-requests" : `/api/admin/prayer-requests?status=${filter}`;
    adminApi<DbPrayerRequest[]>(url).then(setItems).catch(() => {});
  };

  useEffect(load, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await adminApi(`/api/admin/prayer-requests/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this prayer request permanently?")) return;
    await adminApi(`/api/admin/prayer-requests/${id}`, { method: "DELETE" });
    load();
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  const langLabel = (l: string) => {
    if (l === "fr") return "FR";
    if (l === "ht") return "HT";
    return "EN";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-admin-prayers-title">Prayer Requests</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-prayers-all">All</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-prayers-pending">Pending</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-prayers-approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-prayers-rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No prayer requests found</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold" data-testid={`prayer-name-${p.id}`}>{p.name}</p>
                      <Badge variant={statusColor(p.status)} data-testid={`prayer-status-${p.id}`}>{p.status}</Badge>
                      <Badge variant="outline">{langLabel(p.language)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                      <span className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetail(p)} data-testid={`button-view-prayer-${p.id}`}><Eye className="w-4 h-4" /></Button>
                    {p.status !== "approved" && (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(p.id, "approved")} title="Approve" data-testid={`button-approve-prayer-${p.id}`}><Check className="w-4 h-4 text-green-600" /></Button>
                    )}
                    {p.status !== "rejected" && (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(p.id, "rejected")} title="Reject" data-testid={`button-reject-prayer-${p.id}`}><X className="w-4 h-4 text-orange-600" /></Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)} title="Delete" data-testid={`button-delete-prayer-${p.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Prayer Request Details</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{detail.name}</p>
                <p className="text-sm text-muted-foreground">{detail.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusColor(detail.status)}>{detail.status}</Badge>
                <Badge variant="outline">{langLabel(detail.language)}</Badge>
              </div>
              <p className="text-sm whitespace-pre-wrap">{detail.message}</p>
              <p className="text-xs text-muted-foreground">Submitted: {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "N/A"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
