import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Play, Music2, Globe, ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/LanguageContext";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { Link } from "wouter";
import type { MusicTrack, Playlist } from "@shared/schema";

interface PublicPlaylistData extends Playlist {
  songIds: string[];
}

export default function SharedPlaylist() {
  const { t } = useLanguage();
  const { playTrack } = useAudioPlayer();
  const [, params] = useRoute("/playlist/:id");
  const playlistId = params?.id;

  const { data: playlist, isLoading: playlistLoading, isError } = useQuery<PublicPlaylistData>({
    queryKey: ["/api/playlists/public", playlistId],
    enabled: !!playlistId,
    retry: false,
  });

  const { data: allTracks = [] } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music"],
    staleTime: 30 * 1000,
  });

  const playlistTracks = playlist
    ? (playlist?.songIds ?? [])
        .map(sid => allTracks.find(t => t.id === sid))
        .filter((t): t is MusicTrack => t != null)
    : [];

  const handlePlayAll = () => {
    const playable = playlistTracks.filter(t => !t.locked);
    if (playable.length > 0) {
      playTrack(playable[0], playable, 0);
    }
  };

  const handlePlaySong = (track: MusicTrack, index: number) => {
    if (track.locked) return;
    const playable = playlistTracks.filter(t => !t.locked);
    const adjustedIndex = playable.findIndex(t => t.id === track.id);
    playTrack(track, playable, adjustedIndex >= 0 ? adjustedIndex : 0);
  };

  if (playlistLoading) {
    return (
      <div className="flex flex-col min-h-full px-5 py-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist || isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 py-12 text-center">
        <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          {t("noResults")}
        </h2>
        <Link href="/music">
          <Button variant="outline" data-testid="button-back-to-music">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("musicWorship")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-6">
      <div className="px-5 py-6">
        <Link href="/music">
          <Button variant="ghost" size="sm" className="mb-3" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("musicWorship")}
          </Button>
        </Link>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="secondary" className="text-[10px]">
            <Globe className="w-3 h-3 mr-0.5" />
            {t("sharedPlaylist")}
          </Badge>
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1" data-testid="text-playlist-title">
          {playlist.name}
        </h1>
        {playlist.description && (
          <p className="text-muted-foreground text-sm">{playlist.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {playlistTracks.length} {t("songs")}
        </p>
      </div>

      <div className="px-5 mb-4">
        <Button
          onClick={handlePlayAll}
          disabled={playlistTracks.length === 0}
          data-testid="button-play-all-shared"
        >
          <Play className="w-4 h-4 mr-2" />
          {t("playAll")}
        </Button>
      </div>

      <div className="px-5 flex-1">
        <ScrollArea className="h-[400px]">
          {playlistTracks.length > 0 ? (
            <div className="space-y-1">
              {playlistTracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => handlePlaySong(track, index)}
                  disabled={track.locked}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                    track.locked ? "opacity-50 cursor-not-allowed" : "hover-elevate active-elevate-2"
                  }`}
                  data-testid={`shared-track-${track.id}`}
                >
                  <div
                    className="w-12 h-12 rounded-md bg-cover bg-center flex-shrink-0 shadow-sm"
                    style={{
                      backgroundImage: `url(${track.albumArt})`,
                      backgroundColor: "hsl(var(--muted))",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {track.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">{track.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Music2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">{t("emptyPlaylist")}</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
