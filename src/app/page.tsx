"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import TrackList from "@/components/TrackList";
import Player from "@/components/Player";
import { useSearch } from "@/hooks/useSearch";
import { useLikes } from "@/hooks/useLikes";
import { TrackInfo } from "@/types";

export default function Home() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    searchTracks,
  } = useSearch();

  const { toggleLike, isLiked } = useLikes();
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelectTrack = (track: TrackInfo) => {
    setCurrentTrack(track);
  };

  return (
    <main className="h-screen bg-black text-white overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col overflow-hidden">
        <div className="text-center mb-6 animate-fadeIn flex items-center justify-between">
          <div className="flex-1" />
          <h1 className="text-5xl font-bold mb-2 tracking-tight">
            Sound<span className="text-neutral-500">Next</span>
          </h1>
          <div className="flex-1 flex justify-end">
            <Link
              href="/profile"
              className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={searchTracks}
            loading={loading}
            error={error}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="lg:col-span-2 overflow-hidden">
            <TrackList
              tracks={searchResults}
              currentTrack={currentTrack}
              onSelectTrack={handleSelectTrack}
              loading={loading}
              onToggleLike={toggleLike}
              isLiked={isLiked}
              isPlaying={isPlaying}
            />
          </div>

          <div className="lg:col-span-1 overflow-hidden">
            <Player
              track={currentTrack}
              onToggleLike={currentTrack ? toggleLike : undefined}
              isLiked={currentTrack ? isLiked : undefined}
              onPlayingChange={setIsPlaying}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
