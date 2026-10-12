import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import type { MusicTrack } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AudioPlayerState {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  currentTrackIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  playbackError: string | null;
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
  clearPlaybackError: () => void;
}

type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

function setNativeAudioSource(audio: HTMLAudioElement, track: MusicTrack): void {
  audio.pause();
  audio.src = track.audioUrl ?? "";
}

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
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem("bp-player-volume");
      return saved ? Math.min(100, Math.max(0, parseInt(saved, 10))) : 80;
    } catch { return 80; }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentTrackIndexRef.current = currentTrackIndex; }, [currentTrackIndex]);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  const lastLoggedSongIdRef = useRef<string | null>(null);
  const playLogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playlistRef = useRef<MusicTrack[]>([]);
  const currentTrackIndexRef = useRef(0);

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

  const updateMediaSession = useCallback((track: MusicTrack) => {
    if (!("mediaSession" in navigator)) return;

    const artwork = track?.albumArt
      ? [
          { src: track.albumArt, sizes: "96x96", type: "image/jpeg" },
          { src: track.albumArt, sizes: "128x128", type: "image/jpeg" },
          { src: track.albumArt, sizes: "192x192", type: "image/jpeg" },
          { src: track.albumArt, sizes: "256x256", type: "image/jpeg" },
          { src: track.albumArt, sizes: "384x384", type: "image/jpeg" },
          { src: track.albumArt, sizes: "512x512", type: "image/jpeg" },
        ]
      : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track?.title ?? "",
      artist: track?.artist ?? "",
      album: "Bénédictions Partagées",
      artwork,
    });
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
      setIsLoading(false);
      handleAutoNext();
    };
    const onPlay = () => { setIsPlaying(true); setIsLoading(false); setPlaybackError(null); };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      const src = audio.src || audio.currentSrc;
      if (!src) {
        setPlaybackError("No audio source for this track.");
        return;
      }
      // Retry once on transient failure
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        setIsLoading(true);
        const currentSrc = audio.src;
        audio.src = "";
        audio.load();
        setTimeout(() => { audio.src = currentSrc; audio.load(); audio.play().catch(() => {}); }, 800);
        return;
      }
      setPlaybackError("Could not load this track. Check your connection and try again.");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const playTrackAtIndex = useCallback((idx: number) => {
    const list = playlistRef.current;
    const audio = audioRef.current;
    const nextTrack = list[idx];
    if (!nextTrack || !audio) return;
    retryCountRef.current = 0;
    setPlaybackError(null);
    setCurrentTrackIndex(idx);
    setCurrentTrack(nextTrack);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setNativeAudioSource(audio, nextTrack);
    updateMediaSession(nextTrack);
    logPlay(nextTrack.id);
    audio.play().catch(() => {});
  }, [updateMediaSession, logPlay]);

  const handleAutoNext = useCallback(() => {
    const nextIndex = currentTrackIndexRef.current + 1;
    if (nextIndex < playlistRef.current.length) {
      playTrackAtIndex(nextIndex);
    } else {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [playTrackAtIndex]);

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

    retryCountRef.current = 0;
    setPlaybackError(null);
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setNativeAudioSource(audio, track);
    updateMediaSession(track);
    logPlay(track.id);
    audio.play().catch(() => {
      // play() rejection is handled via error/canplay events; keep loading state until resolved
    });
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
    setPlaybackError(null);
    if (audio.paused) {
      setIsLoading(true);
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
    try { localStorage.setItem("bp-player-volume", String(vol)); } catch {}
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  }, []);

  const next = useCallback(() => {
    const nextIndex = currentTrackIndexRef.current + 1;
    if (nextIndex < playlistRef.current.length) {
      playTrackAtIndex(nextIndex);
    }
  }, [playTrackAtIndex]);

  const prev = useCallback(() => {
    const prevIdx = currentTrackIndexRef.current - 1;
    if (prevIdx >= 0) {
      // If more than 3 seconds in, restart current track instead
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        return;
      }
      playTrackAtIndex(prevIdx);
    }
  }, [playTrackAtIndex]);

  const setPlaylist = useCallback((tracks: MusicTrack[], startIndex = 0) => {
    setPlaylistState(tracks);
    setPlaybackError(null);
    if (tracks.length === 0) {
      setCurrentTrackIndex(0);
      setCurrentTrack(null);
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
      return;
    }
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
        isLoading,
        playbackError,
        clearPlaybackError: () => setPlaybackError(null),
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
