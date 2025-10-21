"use client";

import { useState, useEffect } from "react";
import { TrackInfo } from "@/types";

export function useLikes() {
  const [likedTracks, setLikedTracks] = useState<TrackInfo[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("liked_tracks");
    if (stored) {
      setLikedTracks(JSON.parse(stored));
    }
  }, []);

  const toggleLike = (track: TrackInfo) => {
    setLikedTracks((prev) => {
      const isLiked = prev.some((t) => t.id === track.id);
      const newLikes = isLiked
        ? prev.filter((t) => t.id !== track.id)
        : [...prev, track];
      
      localStorage.setItem("liked_tracks", JSON.stringify(newLikes));
      return newLikes;
    });
  };

  const isLiked = (trackId: number) => {
    return likedTracks.some((t) => t.id === trackId);
  };

  return { likedTracks, toggleLike, isLiked };
}

