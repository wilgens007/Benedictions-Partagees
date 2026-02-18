import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adminApi, getAdminToken } from "@/lib/adminAuth";
import { Plus, Pencil, Trash2, Upload, Link as LinkIcon, Music, Disc } from "lucide-react";
import type { Album, Song } from "@shared/schema";

function getSongStatus(song: Song): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!song.isEarlyAccess) return { label: "Public", variant: "default" };
  if (song.publicReleaseAt && new Date(song.publicReleaseAt) <= new Date()) return { label: "Public", variant: "default" };
  if (song.publicReleaseAt) return { label: "Scheduled", variant: "secondary" };
  return { label: "Early Access", variant: "outline" };
}

function AlbumForm({ album, onSave, onCancel }: { album?: Album; onSave: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(album?.title || "");
  const [artist, setArtist] = useState(album?.artist || "");
  const [coverUrl, setCoverUrl] = useState(album?.coverUrl || "");
  const [coverMode, setCoverMode] = useState<"url" | "upload">("url");
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const data = await adminApi<{ url: string }>("/api/admin/upload/cover", { method: "POST", body: formData, headers: { "x-admin-token": getAdminToken() || "" } });
    setCoverUrl(data.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (album) {
        await adminApi(`/api/admin/albums/${album.id}`, { method: "PUT", body: JSON.stringify({ title, artist, coverUrl }) });
      } else {
        await adminApi("/api/admin/albums", { method: "POST", body: JSON.stringify({ title, artist, coverUrl }) });
      }
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-album-title" />
      </div>
      <div className="space-y-2">
        <Label>Artist</Label>
        <Input value={artist} onChange={(e) => setArtist(e.target.value)} required data-testid="input-album-artist" />
      </div>
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant={coverMode === "url" ? "default" : "outline"} size="sm" onClick={() => setCoverMode("url")}><LinkIcon className="w-3 h-3 mr-1" /> URL</Button>
          <Button type="button" variant={coverMode === "upload" ? "default" : "outline"} size="sm" onClick={() => setCoverMode("upload")}><Upload className="w-3 h-3 mr-1" /> Upload</Button>
        </div>
        {coverMode === "url" ? (
          <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." data-testid="input-album-cover-url" />
        ) : (
          <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} data-testid="input-album-cover-upload" />
        )}
        {coverUrl && <img src={coverUrl} alt="Cover" className="w-20 h-20 object-cover rounded mt-2" />}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving} data-testid="button-save-album">{saving ? "Saving..." : album ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}

function SongForm({ song, albumsList, onSave, onCancel }: { song?: Song; albumsList: Album[]; onSave: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(song?.title || "");
  const [artist, setArtist] = useState(song?.artist || "Bénédictions Partagées Music");
  const [albumId, setAlbumId] = useState(song?.albumId || "");
  const [coverUrl, setCoverUrl] = useState(song?.coverUrl || "");
  const [audioUrl, setAudioUrl] = useState(song?.audioUrl || "");
  const [duration, setDuration] = useState(song?.duration || "");
  const [isEarlyAccess, setIsEarlyAccess] = useState(song?.isEarlyAccess || false);
  const [publicReleaseAt, setPublicReleaseAt] = useState(song?.publicReleaseAt ? new Date(song.publicReleaseAt).toISOString().slice(0, 16) : "");
  const [coverMode, setCoverMode] = useState<"url" | "upload">("url");
  const [audioMode, setAudioMode] = useState<"url" | "upload">("url");
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (file: File, type: "cover" | "audio") => {
    const formData = new FormData();
    formData.append("file", file);
    const endpoint = type === "cover" ? "/api/admin/upload/cover" : "/api/admin/upload/audio";
    const data = await adminApi<{ url: string }>(endpoint, { method: "POST", body: formData, headers: { "x-admin-token": getAdminToken() || "" } });
    if (type === "cover") setCoverUrl(data.url);
    else setAudioUrl(data.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title, artist,
        albumId: albumId || null,
        coverUrl: coverUrl || null,
        audioUrl,
        duration: duration || null,
        isEarlyAccess,
        publicReleaseAt: publicReleaseAt ? new Date(publicReleaseAt).toISOString() : null,
      };
      if (song) {
        await adminApi(`/api/admin/songs/${song.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminApi("/api/admin/songs", { method: "POST", body: JSON.stringify(body) });
      }
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-song-title" />
        </div>
        <div className="space-y-2">
          <Label>Artist</Label>
          <Input value={artist} onChange={(e) => setArtist(e.target.value)} required data-testid="input-song-artist" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Album (optional)</Label>
        <Select value={albumId} onValueChange={setAlbumId}>
          <SelectTrigger data-testid="select-song-album"><SelectValue placeholder="No album" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No album</SelectItem>
            {albumsList.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Audio</Label>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant={audioMode === "url" ? "default" : "outline"} size="sm" onClick={() => setAudioMode("url")}><LinkIcon className="w-3 h-3 mr-1" /> URL</Button>
          <Button type="button" variant={audioMode === "upload" ? "default" : "outline"} size="sm" onClick={() => setAudioMode("upload")}><Upload className="w-3 h-3 mr-1" /> Upload</Button>
        </div>
        {audioMode === "url" ? (
          <Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://cdn1.suno.ai/... or any URL" required data-testid="input-song-audio-url" />
        ) : (
          <Input type="file" accept="audio/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "audio"); }} data-testid="input-song-audio-upload" />
        )}
      </div>
      <div className="space-y-2">
        <Label>Cover Image (optional)</Label>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant={coverMode === "url" ? "default" : "outline"} size="sm" onClick={() => setCoverMode("url")}><LinkIcon className="w-3 h-3 mr-1" /> URL</Button>
          <Button type="button" variant={coverMode === "upload" ? "default" : "outline"} size="sm" onClick={() => setCoverMode("upload")}><Upload className="w-3 h-3 mr-1" /> Upload</Button>
        </div>
        {coverMode === "url" ? (
          <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." data-testid="input-song-cover-url" />
        ) : (
          <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "cover"); }} data-testid="input-song-cover-upload" />
        )}
      </div>
      <div className="space-y-2">
        <Label>Duration (e.g., 3:45)</Label>
        <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3:45" data-testid="input-song-duration" />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={isEarlyAccess} onCheckedChange={setIsEarlyAccess} data-testid="switch-early-access" />
        <Label>Early Access Only (Premium)</Label>
      </div>
      {isEarlyAccess && (
        <div className="space-y-2">
          <Label>Public Release Date</Label>
          <Input type="datetime-local" value={publicReleaseAt} onChange={(e) => setPublicReleaseAt(e.target.value)} data-testid="input-release-date" />
          <p className="text-xs text-muted-foreground">Leave empty to keep it Premium-only indefinitely.</p>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving} data-testid="button-save-song">{saving ? "Saving..." : song ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}

export default function AdminMusic() {
  const [albumsList, setAlbumsList] = useState<Album[]>([]);
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [editAlbum, setEditAlbum] = useState<Album | undefined>();
  const [showSongForm, setShowSongForm] = useState(false);
  const [editSong, setEditSong] = useState<Song | undefined>();

  const loadData = () => {
    adminApi<Album[]>("/api/admin/albums").then(setAlbumsList).catch(() => {});
    adminApi<Song[]>("/api/admin/songs").then(setSongsList).catch(() => {});
  };

  useEffect(loadData, []);

  const deleteAlbum = async (id: string) => {
    if (!confirm("Delete this album?")) return;
    try {
      await adminApi(`/api/admin/albums/${id}`, { method: "DELETE" });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteSong = async (id: string) => {
    if (!confirm("Delete this song?")) return;
    await adminApi(`/api/admin/songs/${id}`, { method: "DELETE" });
    loadData();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-admin-music-title">Music Manager</h1>
      <Tabs defaultValue="songs">
        <TabsList>
          <TabsTrigger value="albums" data-testid="tab-albums"><Disc className="w-4 h-4 mr-1" /> Albums ({albumsList.length})</TabsTrigger>
          <TabsTrigger value="songs" data-testid="tab-songs"><Music className="w-4 h-4 mr-1" /> Songs ({songsList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={showAlbumForm} onOpenChange={(o) => { setShowAlbumForm(o); if (!o) setEditAlbum(undefined); }}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditAlbum(undefined); setShowAlbumForm(true); }} data-testid="button-add-album"><Plus className="w-4 h-4 mr-1" /> Add Album</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editAlbum ? "Edit Album" : "New Album"}</DialogTitle></DialogHeader>
                <AlbumForm album={editAlbum} onSave={() => { setShowAlbumForm(false); setEditAlbum(undefined); loadData(); }} onCancel={() => { setShowAlbumForm(false); setEditAlbum(undefined); }} />
              </DialogContent>
            </Dialog>
          </div>
          {albumsList.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No albums yet</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {albumsList.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {a.coverUrl ? <img src={a.coverUrl} alt={a.title} className="w-14 h-14 rounded object-cover" /> : <div className="w-14 h-14 rounded bg-muted flex items-center justify-center"><Disc className="w-6 h-6 text-muted-foreground" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" data-testid={`album-title-${a.id}`}>{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.artist}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditAlbum(a); setShowAlbumForm(true); }} data-testid={`button-edit-album-${a.id}`}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteAlbum(a.id)} data-testid={`button-delete-album-${a.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="songs" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={showSongForm} onOpenChange={(o) => { setShowSongForm(o); if (!o) setEditSong(undefined); }}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditSong(undefined); setShowSongForm(true); }} data-testid="button-add-song"><Plus className="w-4 h-4 mr-1" /> Add Song</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editSong ? "Edit Song" : "New Song"}</DialogTitle></DialogHeader>
                <SongForm song={editSong} albumsList={albumsList} onSave={() => { setShowSongForm(false); setEditSong(undefined); loadData(); }} onCancel={() => { setShowSongForm(false); setEditSong(undefined); }} />
              </DialogContent>
            </Dialog>
          </div>
          {songsList.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No songs yet</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {songsList.map((s) => {
                const status = getSongStatus(s);
                const album = albumsList.find((a) => a.id === s.albumId);
                return (
                  <Card key={s.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      {s.coverUrl ? <img src={s.coverUrl} alt={s.title} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 rounded bg-muted flex items-center justify-center"><Music className="w-5 h-5 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate" data-testid={`song-title-${s.id}`}>{s.title}</p>
                          <Badge variant={status.variant} data-testid={`song-badge-${s.id}`}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.artist}{album ? ` \u2022 ${album.title}` : ""}{s.duration ? ` \u2022 ${s.duration}` : ""}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditSong(s); setShowSongForm(true); }} data-testid={`button-edit-song-${s.id}`}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteSong(s.id)} data-testid={`button-delete-song-${s.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
