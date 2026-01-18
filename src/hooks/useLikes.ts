"use client";

import { useState, useEffect } from "react";
import { TrackInfo } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export function useLikes() {
  const [likedTracks, setLikedTracks] = useState<TrackInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLikes = async () => {
      try {
        const response = await fetch(`${API_URL}/likes`);
        if (response.ok) {
          const serverLikes = await response.json();
          setLikedTracks(serverLikes);
          localStorage.setItem("liked_tracks", JSON.stringify(serverLikes));
        } else {
          const stored = localStorage.getItem("liked_tracks");
          if (stored) {
            const localLikes = JSON.parse(stored);
            setLikedTracks(localLikes);
            try {
              await fetch(`${API_URL}/likes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(localLikes),
              });
            } catch (err) {
              console.log("Server sync failed, will retry on next action");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load likes from server, using localStorage:", error);
        const stored = localStorage.getItem("liked_tracks");
        if (stored) {
          setLikedTracks(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadLikes();
  }, []);

  const toggleLike = async (track: TrackInfo) => {
    const isCurrentlyLiked = likedTracks.some((t) => t.id === track.id);
    const newLikes = isCurrentlyLiked
      ? likedTracks.filter((t) => t.id !== track.id)
      : [...likedTracks, track];
    
    setLikedTracks(newLikes);
    localStorage.setItem("liked_tracks", JSON.stringify(newLikes));
    
    try {
      if (isCurrentlyLiked) {
        await fetch(`${API_URL}/likes/${track.id}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`${API_URL}/likes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(track),
        });
      }
    } catch (error) {
      console.error("Failed to sync like with server:", error);
    }
  };

  const isLiked = (trackId: number) => {
    return likedTracks.some((t) => t.id === trackId);
  };

  return { likedTracks, toggleLike, isLiked, isLoading };
}

