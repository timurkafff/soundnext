"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import TrackList from "@/components/TrackList";
import Player from "@/components/Player";
import AudioVisualizer from "@/components/AudioVisualizer";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleSelectTrack = (track: TrackInfo) => {
    setCurrentTrack(track);
  };

  const handlePlayingChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleAudioElement = (element: HTMLAudioElement | null) => {
    setAudioElement(element);
  };

  return (
    <main className="h-screen bg-black text-white overflow-hidden flex flex-col relative">
      {/* Audio Visualizer Background */}
      <AudioVisualizer isPlaying={isPlaying} audioElement={audioElement} />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <div className="text-center mb-6 animate-fadeIn">
          <h1 className="text-5xl font-bold mb-2 tracking-tight">
            Sound<span className="text-neutral-500">Next</span>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={searchTracks}
            loading={loading}
            error={error}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Search Results */}
          <div className="lg:col-span-2 overflow-hidden">
            <TrackList
              tracks={searchResults}
              currentTrack={currentTrack}
              onSelectTrack={handleSelectTrack}
              loading={loading}
            />
          </div>

          {/* Player */}
          <div className="lg:col-span-1 overflow-hidden">
            <Player 
              track={currentTrack} 
              onPlayingChange={handlePlayingChange}
              onAudioElement={handleAudioElement}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
