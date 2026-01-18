"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import TrackList from "@/components/TrackList";
import PlayerUI from "@/components/PlayerUI";
import { useSearch } from "@/hooks/useSearch";
import { useLikes } from "@/hooks/useLikes";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { TrackInfo } from "@/types";

export default function Home() {
  const router = useRouter();

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    searchTracks,
  } = useSearch();

  const { toggleLike, isLiked } = useLikes();
  const { currentTrack, isPlaying, setCurrentTrack, setPlaylist } = usePlayer();

  const isNavigatingRef = useRef(false);

  const swipeRef = useSwipeNavigation({
    onSwipeRight: () => {
      const node = swipeRef.current;
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (node) {
        node.classList.remove("swipe-out-right");
        // force reflow so re-adding class retriggers animation
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        node.offsetWidth;
        node.classList.add("swipe-out-right");
        setTimeout(() => router.push("/profile", { scroll: false }), 280);
      } else {
        router.push("/profile", { scroll: false });
      }
    },
  });

  useEffect(() => {
    setPlaylist(searchResults);
  }, [searchResults, setPlaylist]);

  const handleSelectTrack = (track: TrackInfo) => {
    setCurrentTrack(track);
  };

  useEffect(() => {
    router.prefetch("/profile");
  }, [router]);

  return (
    <main ref={swipeRef} className="h-screen bg-black text-white overflow-hidden flex flex-col relative">
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="text-center">
              <h1 className="text-5xl font-bold tracking-tight">
                Sound<span className="gradient-text">Next</span>
              </h1>
            </div>
            <div className="flex-1 flex justify-end gap-3" />
          </div>
        </header>

        <div className="mb-6 animate-fadeIn stagger-1">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={searchTracks}
            loading={loading}
            error={error}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="lg:col-span-2 overflow-hidden animate-slideIn stagger-2">
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

          <div className="lg:col-span-1 overflow-hidden animate-scaleIn stagger-3">
            <PlayerUI
              onToggleLike={toggleLike}
              isLiked={isLiked}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
