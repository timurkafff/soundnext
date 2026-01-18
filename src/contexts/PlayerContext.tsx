"use client";

import { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
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
  analyserRef: React.RefObject<AnalyserNode | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const API_URL = "http://localhost:8000";

// Глобальный аудио элемент — не пересоздаётся при смене маршрута
let globalAudio: HTMLAudioElement | null = null;
let globalAudioContext: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;
let globalSource: MediaElementAudioSourceNode | null = null;

function getGlobalAudio(): HTMLAudioElement {
  if (typeof window === "undefined") return null as unknown as HTMLAudioElement;
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.crossOrigin = "anonymous";
    globalAudio.preload = "auto";
  }
  return globalAudio;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrackState] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<TrackInfo[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<TrackInfo[]>([]);
  const currentTrackRef = useRef<TrackInfo | null>(null);
  const isRestoringRef = useRef(false);
  
  // Web Audio API refs (используем глобальные)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pathname = usePathname();

  // Инициализация глобального аудио
  useEffect(() => {
    audioRef.current = getGlobalAudio();
    audioContextRef.current = globalAudioContext;
    analyserRef.current = globalAnalyser;
    sourceRef.current = globalSource;

    const audio = audioRef.current;
    
    // Проверяем, играет ли уже аудио (при переходе между страницами)
    if (audio && !audio.paused && audio.src) {
      // Аудио уже играет - синхронизируем React состояние с ним
      const savedTrack = sessionStorage.getItem("currentTrack");
      if (savedTrack) {
        const track = JSON.parse(savedTrack) as TrackInfo;
        setCurrentTrackState(track);
        currentTrackRef.current = track;
        setIsPlaying(true);
        setCurrentTime(audio.currentTime);
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        } else if (track.duration) {
          setDuration(track.duration / 1000);
        }
      }
      return;
    }

    // Восстанавливаем состояние из sessionStorage (первый запуск или после паузы)
    const savedTrack = sessionStorage.getItem("currentTrack");
    const savedTime = sessionStorage.getItem("currentTime");
    const savedPlaying = sessionStorage.getItem("isPlaying");

    if (savedTrack && !currentTrackRef.current) {
      isRestoringRef.current = true;
      const track = JSON.parse(savedTrack) as TrackInfo;
      setCurrentTrackState(track);
      currentTrackRef.current = track;

      if (audio) {
        const expectedSrc = `${API_URL}/stream?url=${encodeURIComponent(track.url)}`;
        
        // Загружаем src только если он изменился
        if (audio.src !== expectedSrc) {
          audio.src = expectedSrc;
          audio.load();
        }

        if (savedTime) {
          audio.currentTime = parseFloat(savedTime);
          setCurrentTime(parseFloat(savedTime));
        }

        if (savedPlaying === "true") {
          setIsPlaying(true);
          audio.play().catch(() => {
            // Браузер заблокировал - ждём взаимодействия пользователя
          });
        }
      }

      setTimeout(() => {
        isRestoringRef.current = false;
      }, 500);
    }
  }, []);

  // Сохраняем состояние при изменениях
  useEffect(() => {
    if (currentTrack) {
      sessionStorage.setItem("currentTrack", JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

  useEffect(() => {
    sessionStorage.setItem("currentTime", currentTime.toString());
  }, [currentTime]);

  useEffect(() => {
    sessionStorage.setItem("isPlaying", isPlaying.toString());
  }, [isPlaying]);

  const setCurrentTrack = useCallback((track: TrackInfo | null) => {
    setCurrentTrackState(track);
    if (track) {
      sessionStorage.setItem("currentTrack", JSON.stringify(track));
    } else {
      sessionStorage.removeItem("currentTrack");
    }
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioRef.current || globalSource) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      globalAudioContext = new AudioContextClass();
      audioContextRef.current = globalAudioContext;
      
      globalAnalyser = globalAudioContext.createAnalyser();
      globalAnalyser.fftSize = 256;
      globalAnalyser.smoothingTimeConstant = 0.7;
      analyserRef.current = globalAnalyser;
      
      globalSource = globalAudioContext.createMediaElementSource(audioRef.current);
      globalSource.connect(globalAnalyser);
      globalAnalyser.connect(globalAudioContext.destination);
      sourceRef.current = globalSource;
      
      console.log("Web Audio API initialized");
    } catch (error) {
      console.error("Failed to init audio context:", error);
    }
  }, []);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      initAudioContext();
      
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Проверяем реальное состояние audio, а не React state
      if (!audio.paused) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [initAudioContext]);

  const attemptResume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const resumeAudioContext = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };

    const savedPlaying = sessionStorage.getItem("isPlaying");
    const shouldPlay = savedPlaying === "true" || isPlaying;

    if (!shouldPlay || !audio.src) return;

    const tryPlay = (attempt = 0) => {
      resumeAudioContext();
      if (!audio.paused) return;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Если блокирует, попробуем ещё раз через небольшой интервал
        if (attempt < 2) {
          setTimeout(() => tryPlay(attempt + 1), attempt === 0 ? 150 : 400);
        }
      });
    };

    tryPlay();
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    const currentPlaylist = playlistRef.current;
    const current = currentTrackRef.current;
    
    if (currentPlaylist.length === 0 || !current) return;
    
    const currentIndex = currentPlaylist.findIndex(t => t.id === current.id);
    
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
    
    if (currentPlaylist.length === 0 || !current) return;
    
    const currentIndex = currentPlaylist.findIndex(t => t.id === current.id);
    
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

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack && audio && !isRestoringRef.current) {
      // Устанавливаем src только если он отличается
      const newSrc = `${API_URL}/stream?url=${encodeURIComponent(currentTrack.url)}`;
      if (audio.src !== newSrc) {
        audio.src = newSrc;
        setCurrentTime(0);
        setIsPlaying(false);

        if (currentTrack.duration) {
          setDuration(currentTrack.duration / 1000);
        }

        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((error) => {
              console.error("Autoplay failed:", error);
              setIsPlaying(false);
            });
        }
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
      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', previousTrack);
    }
  }, [nextTrack, previousTrack]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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

  // При смене маршрута поддерживаем непрерывное воспроизведение и будим AudioContext
  useEffect(() => {
    attemptResume();
  }, [pathname, attemptResume]);

  // Также пробуем резюмировать при взаимодействии/возврате вкладки
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        attemptResume();
      }
    };

    const onUser = () => attemptResume();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointerdown', onUser, { passive: true });
    window.addEventListener('keydown', onUser, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerdown', onUser);
      window.removeEventListener('keydown', onUser);
    };
  }, [attemptResume]);

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
        analyserRef,
      }}
    >
      {children}
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

