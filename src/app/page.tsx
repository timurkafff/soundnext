"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import TrackList from "@/components/TrackList";
import Player from "@/components/Player";
import { useSearch } from "@/hooks/useSearch";
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

  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);

  const handleSelectTrack = (track: TrackInfo) => {
    setCurrentTrack(track);
  };

  return (
    <main className="h-screen bg-black text-white overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col overflow-hidden">
        <div className="text-center mb-6 animate-fadeIn">
          <h1 className="text-5xl font-bold mb-2 tracking-tight">
            Sound<span className="text-neutral-500">Next</span>
          </h1>
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
            />
          </div>

          <div className="lg:col-span-1 overflow-hidden">
            <Player track={currentTrack} />
          </div>
        </div>
      </div>
    </main>
  );
}
