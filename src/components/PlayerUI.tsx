"use client";

import { useState } from "react";
import { TrackInfo } from "@/types";
import { usePlayer } from "@/contexts/PlayerContext";

interface PlayerUIProps {
  onToggleLike?: (track: TrackInfo) => void;
  isLiked?: (trackId: number) => boolean;
}

const formatTime = (seconds: number) => {
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

export default function PlayerUI({ onToggleLike, isLiked }: PlayerUIProps) {
  const { currentTrack: track, isPlaying, currentTime, duration, setIsPlaying, audioRef, nextTrack, previousTrack } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const API_URL = "http://localhost:8000";

  const playTrack = async () => {
    if (audioRef?.current) {
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

  const handleSeekStart = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(true);
    setSeekTime(currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setSeekTime(time);
    // Сразу устанавливаем время аудио для мгновенного отклика
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef?.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
  };

  const handleDownload = async () => {
    if (!track || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(`${API_URL}/download?url=${encodeURIComponent(track.url)}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.artist} - ${track.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!track) {
    return (
      <div className="glass rounded-3xl p-6 shadow-2xl h-full flex items-center justify-center">
        <div className="text-center text-neutral-500 animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-800/50 flex items-center justify-center animate-pulse">
            <svg
              className="w-10 h-10 text-neutral-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <p className="font-medium mb-1">No track selected</p>
          <p className="text-sm text-neutral-600">Choose a track to start playing</p>
        </div>
      </div>
    );
  }

  const displayTime = isDragging ? seekTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div className="glass rounded-3xl p-5 shadow-2xl h-full flex flex-col overflow-y-auto custom-scrollbar">
      {/* Album Art */}
      <div className="mb-5 relative group shrink-0">
        <div className={`relative overflow-hidden rounded-2xl ${isPlaying ? 'animate-pulse-glow' : ''}`}>
          {track.artwork_url ? (
            <img
              src={track.artwork_url.replace("-large", "-t500x500")}
              alt={track.title}
              className={`w-full aspect-square rounded-2xl object-cover transition-all duration-700 ${
                isPlaying ? 'scale-100' : 'scale-[0.98]'
              }`}
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <svg
                className="w-20 h-20 text-neutral-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
          
          {/* Playing indicator overlay */}
          {isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="mb-5 shrink-0 text-center">
        <h2 className="text-lg font-bold mb-1 line-clamp-2 animate-fadeIn">
          {track.title}
        </h2>
        <p className="text-neutral-400 text-sm animate-fadeIn stagger-1">
          {track.artist}
        </p>

        <div className="flex justify-center gap-4 text-xs text-neutral-500 mt-3 animate-fadeIn stagger-2">
          {track.playback_count !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/50">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/50">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
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

      {/* Progress Bar */}
      <div className="mt-auto shrink-0">
        <div className="mb-4">
          <div
            className="progress-track relative h-1.5 bg-neutral-800 rounded-full overflow-visible group cursor-pointer"
            onClick={handleProgressClick}
          >
            {/* Progress fill */}
            <div
              className="absolute h-full bg-white rounded-full pointer-events-none"
              style={{ width: `${progress}%`, transitionDuration: isDragging ? '0ms' : '100ms' }}
            />
            {/* Thumb */}
            <div
              className="progress-thumb absolute h-4 w-4 bg-white rounded-full shadow-lg -translate-y-1/3 opacity-0 group-hover:opacity-100 pointer-events-none"
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
              value={displayTime}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={handleSeek}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="absolute inset-0 w-full h-4 -top-1 opacity-0 cursor-pointer z-10"
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-2 font-mono">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(duration > 0 ? duration : (track?.duration || 0) / 1000)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Like Button */}
          {onToggleLike && isLiked && (
            <button
              onClick={(e) => {
                const button = e.currentTarget;
                const svg = button.querySelector('svg');
                const wasLiked = isLiked(track.id);

                if (svg) {
                  svg.classList.remove('animate-likeHeart', 'animate-unlikeHeart');
                  setTimeout(() => {
                    svg.classList.add(wasLiked ? 'animate-unlikeHeart' : 'animate-likeHeart');
                  }, 10);
                }

                onToggleLike(track);
              }}
              className="w-12 h-12 flex items-center justify-center glass-light rounded-full hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <svg
                className={`w-6 h-6 transition-all duration-200 ${
                  isLiked(track.id)
                    ? "fill-white text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                    : "fill-none text-white"
                }`}
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          )}

          {/* Previous Button */}
          <button
            onClick={previousTrack}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white rounded-full hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={playTrack}
            className="play-button w-16 h-16 flex items-center justify-center bg-white text-black rounded-full shadow-lg shadow-white/20"
          >
            {isPlaying ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={nextTrack}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white rounded-full hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-12 h-12 flex items-center justify-center glass-light rounded-full hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
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
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

