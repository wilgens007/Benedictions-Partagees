import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi } from "@/lib/adminAuth";
import { Check, X, Star, Trash2, Eye, Volume2 } from "lucide-react";
import type { Testimony } from "@shared/schema";

export default function AdminTestimonies() {
  const [items, setItems] = useState<Testimony[]>([]);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Testimony | null>(null);

  const load = () => {
    const url = filter === "all" ? "/api/admin/testimonies" : `/api/admin/testimonies?status=${filter}`;
    adminApi<Testimony[]>(url).then(setItems).catch(() => {});
  };

  useEffect(load, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await adminApi(`/api/admin/testimonies/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  };

  const feature = async (id: string) => {
    await adminApi(`/api/admin/testimonies/${id}/feature`, { method: "PUT" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimony permanently?")) return;
    await adminApi(`/api/admin/testimonies/${id}`, { method: "DELETE" });
    load();
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-admin-testimonies-title">Testimonies</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-testimonies-all">All</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-testimonies-pending">Pending</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-testimonies-approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-testimonies-rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No testimonies found</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold" data-testid={`testimony-name-${t.id}`}>{t.nameDisplay}</p>
                      <Badge variant={statusColor(t.status)} data-testid={`testimony-status-${t.id}`}>{t.status}</Badge>
                      {t.isFeatured && <Badge style={{ background: "#D4AF37", color: "white" }} data-testid={`testimony-featured-${t.id}`}><Star className="w-3 h-3 mr-1" /> Featured</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.contentText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {t.audioUrl && <Badge variant="outline"><Volume2 className="w-3 h-3 mr-1" /> Audio</Badge>}
                      <span className="text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetail(t)} data-testid={`button-view-testimony-${t.id}`}><Eye className="w-4 h-4" /></Button>
                    {t.status !== "approved" && (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(t.id, "approved")} title="Approve" data-testid={`button-approve-testimony-${t.id}`}><Check className="w-4 h-4 text-green-600" /></Button>
                    )}
                    {t.status !== "rejected" && (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(t.id, "rejected")} title="Reject" data-testid={`button-reject-testimony-${t.id}`}><X className="w-4 h-4 text-orange-600" /></Button>
                    )}
                    {t.status === "approved" && !t.isFeatured && (
                      <Button size="icon" variant="ghost" onClick={() => feature(t.id)} title="Feature" data-testid={`button-feature-testimony-${t.id}`}><Star className="w-4 h-4" style={{ color: "#D4AF37" }} /></Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)} title="Delete" data-testid={`button-delete-testimony-${t.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Testimony Details</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{detail.nameDisplay}</span>
                <Badge variant={statusColor(detail.status)}>{detail.status}</Badge>
                {detail.isFeatured && <Badge style={{ background: "#D4AF37", color: "white" }}><Star className="w-3 h-3 mr-1" /> Featured</Badge>}
              </div>
              <p className="text-sm whitespace-pre-wrap">{detail.contentText}</p>
              {detail.audioUrl && (
                <div>
                  <p className="text-sm font-medium mb-1">Audio:</p>
                  <audio controls src={detail.audioUrl} className="w-full" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Submitted: {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "N/A"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
