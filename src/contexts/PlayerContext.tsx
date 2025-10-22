"use client";

import { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from "react";
import { TrackInfo } from "@/types";

interface PlayerContextType {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playlist: TrackInfo[];
  setCurrentTrack: (track: TrackInfo | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaylist: (tracks: TrackInfo[]) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  togglePlayPause: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const API_URL = "http://localhost:8000";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<TrackInfo[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playlistRef = useRef<TrackInfo[]>([]);
  const currentTrackRef = useRef<TrackInfo | null>(null);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    const currentPlaylist = playlistRef.current;
    const current = currentTrackRef.current;
    
    if (currentPlaylist.length === 0 || !current) {
      console.log('No playlist or current track');
      return;
    }
    
    const currentIndex = currentPlaylist.findIndex(t => t.id === current.id);
    console.log('Current index:', currentIndex, 'Playlist length:', currentPlaylist.length);
    
    if (currentIndex !== -1 && currentIndex < currentPlaylist.length - 1) {
      setCurrentTrack(currentPlaylist[currentIndex + 1]);
    } else if (currentIndex === currentPlaylist.length - 1) {
      setCurrentTrack(currentPlaylist[0]);
    } else if (currentIndex === -1 && currentPlaylist.length > 0) {
      setCurrentTrack(currentPlaylist[0]);
    }
  }, []);

  const previousTrack = useCallback(() => {
    const currentPlaylist = playlistRef.current;
    const current = currentTrackRef.current;
    
    if (currentPlaylist.length === 0 || !current) {
      console.log('No playlist or current track');
      return;
    }
    
    const currentIndex = currentPlaylist.findIndex(t => t.id === current.id);
    console.log('Previous - Current index:', currentIndex);
    
    if (currentIndex > 0) {
      setCurrentTrack(currentPlaylist[currentIndex - 1]);
    } else if (currentIndex === 0) {
      setCurrentTrack(currentPlaylist[currentPlaylist.length - 1]);
    } else if (currentIndex === -1 && currentPlaylist.length > 0) {
      setCurrentTrack(currentPlaylist[currentPlaylist.length - 1]);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else if (currentTrack?.duration) {
        setDuration(currentTrack.duration / 1000);
      }
    };

    const handleEnded = () => {
      const currentPlaylist = playlistRef.current;
      const current = currentTrackRef.current;
      
      if (currentPlaylist.length > 1 && current) {
        const currentIndex = currentPlaylist.findIndex(t => t.id === current.id);
        if (currentIndex !== -1 && currentIndex < currentPlaylist.length - 1) {
          setCurrentTrack(currentPlaylist[currentIndex + 1]);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack && audio) {
      setCurrentTime(0);
      setIsPlaying(false);

      if (currentTrack.duration) {
        setDuration(currentTrack.duration / 1000);
      }

      audio.load();

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Autoplay failed:", error);
            setIsPlaying(false);
          });
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          artwork: currentTrack.artwork_url ? [
            { src: currentTrack.artwork_url.replace("-large", "-t500x500"), sizes: '500x500', type: 'image/jpeg' },
            { src: currentTrack.artwork_url.replace("-large", "-t300x300"), sizes: '300x300', type: 'image/jpeg' },
          ] : []
        });
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current && !isPlaying) {
          audioRef.current.play();
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousTrack();
      });
    }
  }, [togglePlayPause, nextTrack, previousTrack, isPlaying]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'MediaPlayPause':
        case 'F8':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'MediaTrackNext':
        case 'F9':
          e.preventDefault();
          nextTrack();
          break;
        case 'MediaTrackPrevious':
        case 'F7':
          e.preventDefault();
          previousTrack();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            nextTrack();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault();
            previousTrack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, nextTrack, previousTrack]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playlist,
        setCurrentTrack,
        setIsPlaying,
        setPlaylist,
        nextTrack,
        previousTrack,
        togglePlayPause,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        src={currentTrack ? `${API_URL}/stream?url=${encodeURIComponent(currentTrack.url)}` : undefined}
        style={{ display: "none" }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

