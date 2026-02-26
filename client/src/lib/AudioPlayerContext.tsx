import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import type { MusicTrack } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AudioPlayerState {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

interface AudioPlayerActions {
  playTrack: (track: MusicTrack, playlist?: MusicTrack[], index?: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  next: () => void;
  prev: () => void;
  setPlaylist: (tracks: MusicTrack[], startIndex?: number) => void;
}

type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playlist, setPlaylistState] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);

  const lastLoggedSongIdRef = useRef<string | null>(null);
  const playLogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logPlay = useCallback((songId: string) => {
    if (lastLoggedSongIdRef.current === songId) return;
    if (playLogTimerRef.current) {
      clearTimeout(playLogTimerRef.current);
    }
    playLogTimerRef.current = setTimeout(() => {
      lastLoggedSongIdRef.current = songId;
      apiRequest("POST", "/api/songs/play", { songId }).catch(() => {});
      playLogTimerRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume / 100;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      handleAutoNext();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const handleAutoNext = useCallback(() => {
    setPlaylistState(prevPlaylist => {
      setCurrentTrackIndex(prevIndex => {
        if (prevIndex < prevPlaylist.length - 1) {
          const nextIndex = prevIndex + 1;
          const nextTrack = prevPlaylist[nextIndex];
          if (nextTrack && audioRef.current) {
            setCurrentTrack(nextTrack);
            audioRef.current.src = nextTrack.audioUrl;
            audioRef.current.play().catch(() => {});
            updateMediaSession(nextTrack);
            logPlay(nextTrack.id);
          }
          return nextIndex;
        }
        return prevIndex;
      });
      return prevPlaylist;
    });
  }, [logPlay]);

  const updateMediaSession = useCallback((track: MusicTrack) => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: "Bénédictions Partagées",
      artwork: [
        { src: track.albumArt, sizes: "96x96", type: "image/jpeg" },
        { src: track.albumArt, sizes: "128x128", type: "image/jpeg" },
        { src: track.albumArt, sizes: "192x192", type: "image/jpeg" },
        { src: track.albumArt, sizes: "256x256", type: "image/jpeg" },
        { src: track.albumArt, sizes: "384x384", type: "image/jpeg" },
        { src: track.albumArt, sizes: "512x512", type: "image/jpeg" },
      ],
    });
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      prev();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      next();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
  }, []);

  const playTrack = useCallback((track: MusicTrack, newPlaylist?: MusicTrack[], index?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (newPlaylist) {
      setPlaylistState(newPlaylist);
    }
    if (index !== undefined) {
      setCurrentTrackIndex(index);
    }

    setCurrentTrack(track);
    audio.src = track.audioUrl;
    audio.play().catch(() => {});
    updateMediaSession(track);
    logPlay(track.id);
  }, [updateMediaSession, logPlay]);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  }, []);

  const next = useCallback(() => {
    setPlaylistState(prevPlaylist => {
      setCurrentTrackIndex(prevIndex => {
        if (prevIndex < prevPlaylist.length - 1) {
          const nextIndex = prevIndex + 1;
          const nextTrack = prevPlaylist[nextIndex];
          if (nextTrack && audioRef.current) {
            setCurrentTrack(nextTrack);
            audioRef.current.src = nextTrack.audioUrl;
            audioRef.current.play().catch(() => {});
            updateMediaSession(nextTrack);
            logPlay(nextTrack.id);
          }
          return nextIndex;
        }
        return prevIndex;
      });
      return prevPlaylist;
    });
  }, [updateMediaSession, logPlay]);

  const prev = useCallback(() => {
    setPlaylistState(prevPlaylist => {
      setCurrentTrackIndex(prevIndex => {
        if (prevIndex > 0) {
          const prevIdx = prevIndex - 1;
          const prevTrack = prevPlaylist[prevIdx];
          if (prevTrack && audioRef.current) {
            setCurrentTrack(prevTrack);
            audioRef.current.src = prevTrack.audioUrl;
            audioRef.current.play().catch(() => {});
            updateMediaSession(prevTrack);
            logPlay(prevTrack.id);
          }
          return prevIdx;
        }
        return prevIndex;
      });
      return prevPlaylist;
    });
  }, [updateMediaSession, logPlay]);

  const setPlaylist = useCallback((tracks: MusicTrack[], startIndex = 0) => {
    setPlaylistState(tracks);
    setCurrentTrackIndex(startIndex);
    if (tracks[startIndex]) {
      setCurrentTrack(tracks[startIndex]);
    }
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        playlist,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        play,
        pause,
        toggle,
        seek,
        setVolume,
        next,
        prev,
        setPlaylist,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
