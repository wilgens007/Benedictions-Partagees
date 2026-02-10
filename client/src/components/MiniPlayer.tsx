import { Play, Pause, SkipBack, SkipForward, ChevronUp, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const {
    currentTrack,
    playlist,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    toggle,
    next,
    prev,
    seek,
    pause,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  return (
    <div
      className="fixed left-0 right-0 z-40 bg-card border-t border-card-border shadow-lg"
      style={{ bottom: "64px" }}
      data-testid="mini-player"
    >
      <div className="relative max-w-lg mx-auto">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 1}
          step={0.1}
          onValueChange={(v) => seek(v[0])}
          className="absolute -top-[6px] left-0 right-0 h-[6px] [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          data-testid="mini-player-progress"
        />

        <div className="flex items-center gap-3 px-3 py-2">
          <Link href="/music">
            <div
              className="w-10 h-10 rounded-md bg-cover bg-center flex-shrink-0 cursor-pointer"
              style={{
                backgroundImage: `url(${currentTrack.albumArt})`,
                backgroundColor: "hsl(var(--muted))",
              }}
              data-testid="mini-player-art"
            />
          </Link>

          <Link href="/music" className="flex-1 min-w-0">
            <div className="cursor-pointer">
              <p
                className="text-sm font-medium text-foreground truncate"
                data-testid="mini-player-title"
              >
                {currentTrack.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist} &middot; {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              disabled={currentTrackIndex === 0}
              data-testid="mini-player-prev"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              data-testid="mini-player-toggle"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              disabled={currentTrackIndex >= playlist.length - 1}
              data-testid="mini-player-next"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
