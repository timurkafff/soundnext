"use client";

import { useRef, useEffect, useState } from "react";
import { TrackInfo } from "@/types";

interface PlayerProps {
  track: TrackInfo | null;
}

const formatTime = (seconds: number) => {
  // Проверка на валидность числа
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatNumber = (num: number | null) => {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function Player({ track }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const API_URL = "http://localhost:8000";

  const playTrack = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    } else {
      // Fallback на duration из track info (в миллисекундах)
      if (track && track.duration) {
        setDuration(track.duration / 1000);
      }
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  };

  const handleSeekEnd = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
    }
    setIsDragging(false);
  };

  // Обработка клика по прогресс-бару
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (track && audio) {
      setCurrentTime(0);
      setIsPlaying(false);
      
      if (track.duration) {
        setDuration(track.duration / 1000);
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
    }
  }, [track]);

  if (!track) {
    return (
      <div className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-neutral-800 animate-fadeIn h-full flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-neutral-700 animate-pulse"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
          <p>Select a track to play</p>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-neutral-800 animate-slideUp h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="mb-4 relative group shrink-0">
        {track.artwork_url ? (
          <img
            src={track.artwork_url.replace("-large", "-t500x500")}
            alt={track.title}
            className="w-full aspect-square rounded-2xl shadow-2xl object-cover transition-transform duration-500"
          />
        ) : (
          <div className="w-full aspect-square rounded-2xl bg-neutral-800 flex items-center justify-center">
            <svg
              className="w-20 h-20 text-neutral-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        )}
      </div>

      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold mb-1 line-clamp-2 animate-fadeIn">
          {track.title}
        </h2>
        <p className="text-neutral-400 mb-3 text-sm animate-fadeIn" style={{ animationDelay: "100ms" }}>
          {track.artist}
        </p>

        <div className="flex gap-4 text-xs text-neutral-500 animate-fadeIn" style={{ animationDelay: "200ms" }}>
          {track.playback_count !== null && (
            <div className="flex items-center gap-2 hover:text-neutral-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {formatNumber(track.playback_count)}
            </div>
          )}
          {track.likes_count !== null && (
            <div className="flex items-center gap-2 hover:text-neutral-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              {formatNumber(track.likes_count)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto shrink-0">
        <div className="mb-3">
          <div 
            className="relative h-2 bg-neutral-800 rounded-full overflow-visible group cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-white transition-all rounded-full pointer-events-none"
              style={{ width: `${progress}%`, transitionDuration: isDragging ? '0ms' : '100ms' }}
            />
            <div
              className="absolute h-4 w-4 bg-white rounded-full shadow-lg transition-transform -translate-y-1/4 group-hover:scale-125 pointer-events-none"
              style={{ 
                left: `calc(${progress}% - 8px)`,
                transitionDuration: isDragging ? '0ms' : '100ms'
              }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={currentTime}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={handleSeek}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer z-10"
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration > 0 ? duration : (track?.duration || 0) / 1000)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={playTrack}
            className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-white/20"
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <a
            href={`${API_URL}/download?url=${encodeURIComponent(track.url)}`}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 text-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </a>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        src={`${API_URL}/stream?url=${encodeURIComponent(track.url)}`}
      />
    </div>
  );
}
