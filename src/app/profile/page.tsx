"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import TrackList from "@/components/TrackList";
import PlayerUI from "@/components/PlayerUI";
import { useLikes } from "@/hooks/useLikes";
import { useSearch } from "@/hooks/useSearch";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { TrackInfo } from "@/types";

export default function Profile() {
  const router = useRouter();
  const { likedTracks, toggleLike, isLiked } = useLikes();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    searchTracks,
  } = useSearch();
  const { currentTrack, isPlaying, setCurrentTrack, setPlaylist } = usePlayer();

  const isNavigatingRef = useRef(false);

  const swipeRef = useSwipeNavigation({
    onSwipeLeft: () => {
      const node = swipeRef.current;
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (node) {
        node.classList.remove("swipe-out-left");
        node.offsetWidth;
        node.classList.add("swipe-out-left");
        setTimeout(() => router.push("/", { scroll: false }), 280);
      } else {
        router.push("/", { scroll: false });
      }
    },
  });

  const handleSelectTrack = (track: TrackInfo) => {
    setCurrentTrack(track);
  };

  const displayTracks = searchQuery.trim() ? searchResults : likedTracks;

  useEffect(() => {
    setPlaylist(displayTracks);
  }, [searchResults, likedTracks, searchQuery, setPlaylist]);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  return (
    <main ref={swipeRef} className="h-screen bg-black text-white overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col overflow-hidden">
        <div className="text-center mb-6 animate-fadeIn flex items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-bold mb-2 tracking-tight">
              Liked <span className="text-neutral-500">Tracks</span>
            </h1>
            <div className="px-4 py-2 bg-white rounded-full mb-2">
              <span className="text-2xl font-bold text-black">{likedTracks.length}</span>
            </div>
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

        {!searchQuery.trim() && likedTracks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-neutral-500 animate-fadeIn">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-neutral-700 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
              <p className="text-lg mb-2">No liked tracks yet</p>
              <p className="text-sm">Start liking tracks to see them here</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            <div className="lg:col-span-2 overflow-hidden">
              <TrackList
                tracks={displayTracks}
                currentTrack={currentTrack}
                onSelectTrack={handleSelectTrack}
                loading={loading}
                onToggleLike={toggleLike}
                isLiked={isLiked}
                isPlaying={isPlaying}
              />
            </div>

            <div className="lg:col-span-1 overflow-hidden">
              <PlayerUI
                onToggleLike={toggleLike}
                isLiked={isLiked}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

