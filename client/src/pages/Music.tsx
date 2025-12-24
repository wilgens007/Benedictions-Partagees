import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/LanguageContext";
import type { MusicTrack } from "@shared/schema";

export default function Music() {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  const { data: tracks, isLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music"],
  });

  const currentTrack = tracks?.[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (tracks && currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [tracks, currentTrackIndex]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play();
    }, 100);
  };

  const skipPrevious = () => {
    if (currentTrackIndex > 0) {
      playTrack(currentTrackIndex - 1);
    }
  };

  const skipNext = () => {
    if (tracks && currentTrackIndex < tracks.length - 1) {
      playTrack(currentTrackIndex + 1);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="px-4 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
          {t("musicWorship")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("gospelMusic")}
        </p>
      </div>

      <div className="px-4 mb-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square max-w-[280px] mx-auto mt-6 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : currentTrack ? (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${currentTrack.albumArt})`,
                    backgroundColor: "hsl(var(--muted))"
                  }}
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Volume2 className="w-10 h-10 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground">{t("noResults")}</p>
                </div>
              )}
            </div>

            {currentTrack && (
              <div className="text-center px-4 mb-4">
                <h3 className="font-semibold text-lg text-foreground" data-testid="text-current-track">
                  {currentTrack.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {currentTrack.artist}
                </p>
              </div>
            )}

            <div className="px-6 mb-4">
              <Slider
                value={[progress]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="mb-2"
                data-testid="slider-progress"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pb-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={skipPrevious}
                disabled={currentTrackIndex === 0}
                data-testid="button-previous"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button 
                size="lg"
                className="w-16 h-16 rounded-full"
                onClick={togglePlayPause}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={skipNext}
                disabled={!tracks || currentTrackIndex >= tracks.length - 1}
                data-testid="button-next"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            <div className="px-6 pb-4 flex items-center gap-3">
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

      <div className="flex-1 px-4">
        <h2 className="font-serif font-semibold text-lg text-foreground mb-3">
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
                  onClick={() => playTrack(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    index === currentTrackIndex 
                      ? "bg-primary/10" 
                      : "hover-elevate active-elevate-2"
                  }`}
                  data-testid={`track-${track.id}`}
                >
                  <div 
                    className="w-12 h-12 rounded-md bg-cover bg-center flex-shrink-0"
                    style={{ 
                      backgroundImage: `url(${track.albumArt})`,
                      backgroundColor: "hsl(var(--muted))"
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      index === currentTrackIndex ? "text-primary" : "text-foreground"
                    }`}>
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

      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          preload="metadata"
        />
      )}
    </div>
  );
}
