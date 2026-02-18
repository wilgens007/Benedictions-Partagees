import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/adminAuth";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface UserRow {
  id: string;
  username: string;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [data, setData] = useState<UsersResponse>({ users: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    adminApi<UsersResponse>(`/api/admin/users?${params}`).then(setData).catch(() => {});
  };

  useEffect(load, [page, search]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-admin-users-title">Users</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Username</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                </tr>
              </thead>
              <tbody>
                {data.users.length === 0 ? (
                  <tr><td colSpan={2} className="p-6 text-center text-muted-foreground">No users found</td></tr>
                ) : (
                  data.users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="p-3" data-testid={`user-username-${u.id}`}>{u.username}</td>
                      <td className="p-3 text-muted-foreground text-xs font-mono">{u.id.slice(0, 8)}...</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.total} total users</p>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="button-prev-page">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">Page {page} of {data.totalPages}</span>
            <Button size="icon" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} data-testid="button-next-page">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
