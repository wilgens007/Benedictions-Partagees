import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/LanguageContext";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import type { MusicTrack } from "@shared/schema";

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Music() {
  const { t } = useLanguage();
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

  const { data: tracks, isLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music"],
  });

  useEffect(() => {
    if (tracks && tracks.length > 0 && playlist.length === 0) {
      setPlaylist(tracks, 0);
    }
  }, [tracks, playlist.length, setPlaylist]);

  const handlePlayTrack = (index: number) => {
    if (!tracks) return;
    playTrack(tracks[index], tracks, index);
  };

  const displayTrack = currentTrack || tracks?.[0] || null;

  return (
    <div className="flex flex-col min-h-full pb-20">
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
            <div className="relative mx-auto mt-6 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5" style={{ maxWidth: "280px", aspectRatio: "1" }}>
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
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Volume2 className="w-10 h-10 text-primary/50" />
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
                className="w-16 h-16 rounded-full bg-[#1E3A8A] dark:bg-primary text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
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

      <div className="flex-1 px-5">
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
                <button
                  key={track.id}
                  onClick={() => handlePlayTrack(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    currentTrack?.id === track.id
                      ? "bg-primary/10"
                      : "hover-elevate active-elevate-2"
                  }`}
                  data-testid={`track-${track.id}`}
                >
                  <div
                    className="w-12 h-12 rounded-md bg-cover bg-center flex-shrink-0 shadow-sm"
                    style={{
                      backgroundImage: `url(${track.albumArt})`,
                      backgroundColor: "hsl(var(--muted))",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        currentTrack?.id === track.id ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {track.duration}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("noResults")}</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
