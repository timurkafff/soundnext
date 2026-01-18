"use client";

import { TrackInfo } from "@/types";

interface TrackListProps {
  tracks: TrackInfo[];
  currentTrack: TrackInfo | null;
  onSelectTrack: (track: TrackInfo) => void;
  loading: boolean;
  onToggleLike?: (track: TrackInfo) => void;
  isLiked?: (trackId: number) => boolean;
  isPlaying?: boolean;
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

export default function TrackList({
  tracks,
  currentTrack,
  onSelectTrack,
  loading,
  onToggleLike,
  isLiked,
  isPlaying,
}: TrackListProps) {
  if (loading) {
    return (
      <div className="glass rounded-3xl p-4 shadow-2xl h-full flex flex-col">
        <div className="space-y-3 overflow-hidden flex-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-800/30 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-neutral-700/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-700/50 rounded w-3/4" />
                <div className="h-3 bg-neutral-700/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="glass rounded-3xl p-8 shadow-2xl h-full flex items-center justify-center">
        <div className="text-center text-neutral-500 animate-fadeIn">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-800/50 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-neutral-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Search for music</p>
          <p className="text-sm text-neutral-600">Find your favorite tracks on SoundCloud</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-4 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
      </div>
      <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onSelectTrack(track)}
            style={{ animationDelay: `${index * 30}ms` }}
            className={`track-item flex items-center gap-4 p-3 rounded-2xl cursor-pointer animate-fadeIn ${
              currentTrack?.id === track.id
                ? "active"
                : ""
            }`}
          >
            <div className="shrink-0 relative group">
              {track.artwork_url ? (
                <div className="relative">
                  <img
                    src={track.artwork_url.replace("-large", "-t67x67")}
                    alt={track.title}
                    className={`w-14 h-14 rounded-xl object-cover transition-all duration-300 ${
                      currentTrack?.id === track.id 
                        ? "ring-2 ring-white shadow-lg shadow-white/20" 
                        : "group-hover:scale-105 group-hover:shadow-lg"
                    }`}
                  />
                  {currentTrack?.id === track.id && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <div className="flex items-center gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-white rounded-full animate-soundWave"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                  <svg
                    className="w-7 h-7 text-neutral-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`font-medium truncate transition-colors ${
                currentTrack?.id === track.id ? "text-white" : "group-hover:text-white"
              }`}>
                {track.title}
              </h3>
              <p className="text-sm text-neutral-500 truncate">{track.artist}</p>
              <div className="flex gap-3 text-xs text-neutral-600 mt-1">
                <span className="font-mono">{formatTime(track.duration / 1000)}</span>
                {track.playback_count && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {formatNumber(track.playback_count)}
                  </span>
                )}
                {track.likes_count && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {formatNumber(track.likes_count)}
                  </span>
                )}
              </div>
            </div>

            {onToggleLike && isLiked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
                className="shrink-0 p-2 hover:scale-125 active:scale-95 transition-transform rounded-full hover:bg-neutral-800/50"
              >
                <svg
                  className={`w-5 h-5 transition-all duration-200 ${
                    isLiked(track.id)
                      ? "fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      : "fill-none text-neutral-500 hover:text-white"
                  }`}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
