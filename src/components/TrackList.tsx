"use client";

import { TrackInfo } from "@/types";

interface TrackListProps {
  tracks: TrackInfo[];
  currentTrack: TrackInfo | null;
  onSelectTrack: (track: TrackInfo) => void;
  loading: boolean;
}

const formatTime = (seconds: number) => {
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
}: TrackListProps) {
  if (loading) return null;

  if (tracks.length === 0) {
    return (
      <div className="text-center text-neutral-500 mt-12 animate-fadeIn">
        <svg
          className="w-24 h-24 mx-auto mb-4 text-neutral-700 animate-pulse"
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
        <p className="text-lg">Search for your favorite tracks</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-neutral-800 animate-slideUp h-full flex flex-col">
      <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onSelectTrack(track)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 animate-fadeIn ${
              currentTrack?.id === track.id
                ? "bg-white/10 border border-white/20"
                : "bg-black/30 hover:bg-black/50 border border-transparent hover:border-neutral-800"
            }`}
          >
            {/* Artwork */}
            <div className="shrink-0 relative group">
              {track.artwork_url ? (
                <>
                  <img
                    src={track.artwork_url.replace("-large", "-t67x67")}
                    alt={track.title}
                    className={`w-14 h-14 rounded-xl object-cover transition-all duration-300 ${
                      currentTrack?.id === track.id 
                        ? "ring-2 ring-white shadow-lg shadow-white/20" 
                        : "group-hover:scale-110"
                    }`}
                  />
                </>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center">
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

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate hover:text-neutral-300 transition-colors">
                {track.title}
              </h3>
              <p className="text-sm text-neutral-400 truncate">{track.artist}</p>
              <div className="flex gap-4 text-xs text-neutral-500 mt-1">
                <span>{formatTime(track.duration / 1000)}</span>
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
              </div>
            </div>

            {/* Play Indicator - sound waves */}
            {currentTrack?.id === track.id && (
              <div className="shrink-0 flex items-center gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-white rounded-full animate-soundWave"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
