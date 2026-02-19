import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Lock, Crown,
  Plus, ListMusic, Globe, LockKeyhole, Trash2, Share2, MoreVertical,
  Music2, Copy, Check, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MusicTrack, Playlist } from "@shared/schema";

interface PlaylistWithMeta extends Playlist {
  songCount: number;
  songIds: string[];
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Music() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    playTrack,
    toggle,
    seek,
    setVolume,
    next,
    prev,
    setPlaylist,
    playlist,
  } = useAudioPlayer();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPlaylistDetail, setShowPlaylistDetail] = useState<PlaylistWithMeta | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const isPremium = user?.isPremium === true;

  const { data: tracks, isLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music"],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: userPlaylists, isLoading: playlistsLoading } = useQuery<PlaylistWithMeta[]>({
    queryKey: ["/api/playlists"],
    enabled: isPremium,
  });

  useEffect(() => {
    if (showPlaylistDetail && userPlaylists) {
      const updated = userPlaylists.find(p => p.id === showPlaylistDetail.id);
      if (updated && (updated.songCount !== showPlaylistDetail.songCount || JSON.stringify(updated.songIds) !== JSON.stringify(showPlaylistDetail.songIds))) {
        setShowPlaylistDetail(updated);
      }
    }
  }, [userPlaylists, showPlaylistDetail]);

  useEffect(() => {
    if (tracks && tracks.length > 0) {
      const trackIds = tracks.map(t => t.id).join(",");
      const playlistIds = playlist.map(t => t.id).join(",");
      if (trackIds !== playlistIds) {
        const currentIndex = currentTrack ? tracks.findIndex(t => t.id === currentTrack.id) : 0;
        setPlaylist(tracks, Math.max(currentIndex, 0));
      }
    }
  }, [tracks, playlist, currentTrack, setPlaylist]);

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/playlists", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setShowCreateDialog(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      toast({ title: t("playlistCreated") });
    },
    onError: (err: Error) => {
      let msg = t("noResults");
      try {
        const parsed = JSON.parse(err.message.split(": ").slice(1).join(": "));
        if (parsed.error?.includes("Maximum")) msg = t("maxPlaylists");
        else msg = parsed.error || msg;
      } catch { msg = err.message.includes("Maximum") ? t("maxPlaylists") : err.message; }
      toast({ title: msg, variant: "destructive" });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setShowPlaylistDetail(null);
      toast({ title: t("playlistDeleted") });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await apiRequest("PATCH", `/api/playlists/${id}`, { isPublic });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const res = await apiRequest("POST", `/api/playlists/${playlistId}/songs`, { songId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setShowAddToPlaylist(null);
      toast({ title: t("songAdded") });
    },
    onError: (err: Error) => {
      const msg = err.message;
      if (msg.includes("409") || msg.includes("already")) {
        toast({ title: t("songAlreadyInPlaylist"), variant: "destructive" });
      } else if (msg.includes("Maximum") || msg.includes("100")) {
        toast({ title: t("maxSongs"), variant: "destructive" });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    },
  });

  const removeSongMutation = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}/songs/${songId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({ title: t("songRemoved") });
    },
  });

  const handlePlayTrack = (index: number) => {
    if (!tracks) return;
    const track = tracks[index];
    if (track.locked) {
      toast({
        title: t("earlyAccessOnly"),
        description: t("earlyAccessDesc"),
      });
      return;
    }
    playTrack(track, tracks, index);
  };

  const handlePlayPlaylist = (pl: PlaylistWithMeta) => {
    if (!tracks || pl.songIds.length === 0) return;
    const playlistTracks = pl.songIds
      .map(sid => tracks.find(t => t.id === sid))
      .filter((t): t is MusicTrack => t != null && !t.locked);
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks, 0);
    }
  };

  const handleCopyLink = (playlistId: string) => {
    const url = `${window.location.origin}/playlist/${playlistId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(playlistId);
    toast({ title: t("linkCopied") });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const displayTrack = currentTrack || tracks?.[0] || null;

  const getPlaylistSongDetails = (pl: PlaylistWithMeta) => {
    if (!tracks) return [];
    return pl.songIds
      .map(sid => tracks.find(t => t.id === sid))
      .filter((t): t is MusicTrack => t != null);
  };

  return (
    <div className="flex flex-col min-h-full pb-6">
      <div className="px-5 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1" data-testid="text-page-title">
          {t("musicWorship")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("gospelMusic")}
        </p>
      </div>

      <div className="px-5 mb-6">
        <Card className="shadow-md overflow-visible">
          <CardContent className="p-0">
            <div className="relative mx-auto mt-6 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-[#0A1F44]/20 to-[#0A1F44]/5 dark:from-[#D4AF37]/10 dark:to-[#D4AF37]/5" style={{ maxWidth: "280px", aspectRatio: "1" }}>
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : displayTrack ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${displayTrack.albumArt})`,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#0A1F44]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center">
                      <Volume2 className="w-10 h-10 text-[#0A1F44]/50 dark:text-[#D4AF37]/50" />
                    </div>
                    <p className="text-muted-foreground">{t("noResults")}</p>
                  </div>
                </div>
              )}
            </div>

            {displayTrack && (
              <div className="text-center px-5 mb-4">
                <h3 className="font-serif font-semibold text-lg text-foreground" data-testid="text-current-track">
                  {displayTrack.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {displayTrack.artist}
                </p>
              </div>
            )}

            <div className="px-6 mb-4">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={(v) => seek(v[0])}
                className="mb-2"
                data-testid="slider-progress"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={prev}
                disabled={currentTrackIndex === 0}
                data-testid="button-previous"
              >
                <SkipBack className="w-6 h-6" />
              </Button>

              <button
                className="w-16 h-16 rounded-full bg-[#0A1F44] dark:bg-[#D4AF37] text-white dark:text-[#0A1F44] flex items-center justify-center shadow-md transition-transform active:scale-95"
                onClick={() => {
                  if (!currentTrack && tracks && tracks.length > 0) {
                    handlePlayTrack(0);
                  } else {
                    toggle();
                  }
                }}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={next}
                disabled={!tracks || currentTrackIndex >= tracks.length - 1}
                data-testid="button-next"
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            <div className="px-6 pb-5 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0])}
                className="flex-1"
                data-testid="slider-volume"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 mb-6">
        <h2 className="font-serif font-semibold text-xl text-foreground mb-3">
          {t("nowPlaying")}
        </h2>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-12 h-12 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : tracks && tracks.length > 0 ? (
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    currentTrack?.id === track.id
                      ? "bg-[#D4AF37]/10"
                      : "hover-elevate active-elevate-2"
                  }`}
                  data-testid={`track-${track.id}`}
                >
                  <button
                    onClick={() => handlePlayTrack(index)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    data-testid={`button-play-track-${track.id}`}
                  >
                    <div
                      className="w-12 h-12 rounded-md bg-cover bg-center flex-shrink-0 shadow-sm"
                      style={{
                        backgroundImage: `url(${track.albumArt})`,
                        backgroundColor: "hsl(var(--muted))",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className={`font-medium truncate ${
                            currentTrack?.id === track.id ? "text-[#D4AF37]" : "text-foreground"
                          }`}
                        >
                          {track.title}
                        </p>
                        {track.isEarlyAccess && (
                          <Badge className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] text-[9px] px-1 py-0 no-default-hover-elevate no-default-active-elevate">
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            {t("earlyAccess")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {track.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">
                      {track.duration}
                    </span>
                    {isPremium && !track.locked && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAddToPlaylist(track.id)}
                        data-testid={`button-add-to-playlist-${track.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("noResults")}</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {user && (
        <div className="px-5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 className="font-serif font-semibold text-xl text-foreground flex items-center gap-2">
              <ListMusic className="w-5 h-5" />
              {t("myPlaylists")}
            </h2>
            {isPremium && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-playlist"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("createPlaylist")}
              </Button>
            )}
          </div>

          {!isPremium ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Crown className="w-10 h-10 mx-auto mb-3 text-[#D4AF37]" />
                <p className="font-semibold text-foreground mb-1">{t("premiumFeature")}</p>
                <p className="text-sm text-muted-foreground">{t("playlistPremiumDesc")}</p>
              </CardContent>
            </Card>
          ) : playlistsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userPlaylists && userPlaylists.length > 0 ? (
            <div className="space-y-3">
              {userPlaylists.map((pl) => (
                <Card
                  key={pl.id}
                  className="hover-elevate cursor-pointer"
                  data-testid={`playlist-card-${pl.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="flex-1 text-left min-w-0"
                        onClick={() => setShowPlaylistDetail(pl)}
                        data-testid={`button-open-playlist-${pl.id}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Music2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                          <p className="font-semibold text-foreground truncate">{pl.name}</p>
                          {pl.isPublic ? (
                            <Badge variant="secondary" className="text-[10px]">
                              <Globe className="w-3 h-3 mr-0.5" />
                              {t("publicPlaylist")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              <LockKeyhole className="w-3 h-3 mr-0.5" />
                              {t("privatePlaylist")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pl.songCount} {t("songs")}
                          {pl.description && ` · ${pl.description}`}
                        </p>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-playlist-menu-${pl.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handlePlayPlaylist(pl)}
                            data-testid={`menu-play-playlist-${pl.id}`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {t("playAll")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePublicMutation.mutate({ id: pl.id, isPublic: !pl.isPublic })}
                            data-testid={`menu-toggle-public-${pl.id}`}
                          >
                            {pl.isPublic ? (
                              <><LockKeyhole className="w-4 h-4 mr-2" />{t("makePrivate")}</>
                            ) : (
                              <><Globe className="w-4 h-4 mr-2" />{t("makePublic")}</>
                            )}
                          </DropdownMenuItem>
                          {pl.isPublic && (
                            <DropdownMenuItem
                              onClick={() => handleCopyLink(pl.id)}
                              data-testid={`menu-share-playlist-${pl.id}`}
                            >
                              {copiedLink === pl.id ? (
                                <><Check className="w-4 h-4 mr-2" />{t("linkCopied")}</>
                              ) : (
                                <><Share2 className="w-4 h-4 mr-2" />{t("sharePlaylist")}</>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deletePlaylistMutation.mutate(pl.id)}
                            className="text-destructive"
                            data-testid={`menu-delete-playlist-${pl.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("deletePlaylist")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <ListMusic className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">{t("noPlaylists")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newPlaylist")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("playlistName")}</label>
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder={t("playlistName")}
                maxLength={100}
                data-testid="input-playlist-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("playlistDescription")}</label>
              <Textarea
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder={t("playlistDescription")}
                maxLength={300}
                className="resize-none"
                data-testid="input-playlist-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              data-testid="button-cancel-create"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => createPlaylistMutation.mutate({
                name: newPlaylistName.trim(),
                description: newPlaylistDesc.trim() || undefined,
              })}
              disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
              data-testid="button-confirm-create"
            >
              {t("createPlaylist")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddToPlaylist !== null} onOpenChange={(open) => { if (!open) setShowAddToPlaylist(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addToPlaylist")}</DialogTitle>
          </DialogHeader>
          {userPlaylists && userPlaylists.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {userPlaylists.map((pl) => {
                const alreadyAdded = showAddToPlaylist ? pl.songIds.includes(showAddToPlaylist) : false;
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (!alreadyAdded && showAddToPlaylist) {
                        addSongMutation.mutate({ playlistId: pl.id, songId: showAddToPlaylist });
                      }
                    }}
                    disabled={alreadyAdded || addSongMutation.isPending}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      alreadyAdded ? "opacity-50" : "hover-elevate active-elevate-2"
                    }`}
                    data-testid={`button-add-to-${pl.id}`}
                  >
                    <Music2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{pl.name}</p>
                      <p className="text-xs text-muted-foreground">{pl.songCount} {t("songs")}</p>
                    </div>
                    {alreadyAdded && <Check className="w-4 h-4 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-3">{t("noPlaylists")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddToPlaylist(null);
                  setShowCreateDialog(true);
                }}
                data-testid="button-create-from-add"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("createPlaylist")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPlaylistDetail !== null} onOpenChange={(open) => { if (!open) setShowPlaylistDetail(null); }}>
        <DialogContent className="max-w-md">
          {showPlaylistDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Music2 className="w-5 h-5 text-[#D4AF37]" />
                  {showPlaylistDetail.name}
                  {showPlaylistDetail.isPublic && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Globe className="w-3 h-3 mr-0.5" />
                      {t("publicPlaylist")}
                    </Badge>
                  )}
                </DialogTitle>
                {showPlaylistDetail.description && (
                  <p className="text-sm text-muted-foreground">{showPlaylistDetail.description}</p>
                )}
              </DialogHeader>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handlePlayPlaylist(showPlaylistDetail)}
                  disabled={showPlaylistDetail.songIds.length === 0}
                  data-testid="button-play-all"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {t("playAll")}
                </Button>
                {showPlaylistDetail.isPublic && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(showPlaylistDetail.id)}
                    data-testid="button-copy-link"
                  >
                    {copiedLink === showPlaylistDetail.id ? (
                      <><Check className="w-4 h-4 mr-1" />{t("linkCopied")}</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-1" />{t("copyLink")}</>
                    )}
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[350px]">
                {(() => {
                  const songDetails = getPlaylistSongDetails(showPlaylistDetail);
                  if (songDetails.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Music2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">{t("emptyPlaylist")}</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-1">
                      {songDetails.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                          data-testid={`playlist-song-${track.id}`}
                        >
                          <button
                            onClick={() => {
                              if (!track.locked) {
                                const plTracks = songDetails.filter(t => !t.locked);
                                const idx = plTracks.findIndex(t => t.id === track.id);
                                playTrack(track, plTracks, idx);
                              }
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            data-testid={`button-play-pl-song-${track.id}`}
                          >
                            <div
                              className="w-10 h-10 rounded-md bg-cover bg-center flex-shrink-0"
                              style={{
                                backgroundImage: `url(${track.albumArt})`,
                                backgroundColor: "hsl(var(--muted))",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{track.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSongMutation.mutate({
                              playlistId: showPlaylistDetail.id,
                              songId: track.id,
                            })}
                            data-testid={`button-remove-song-${track.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
