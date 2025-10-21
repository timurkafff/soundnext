"use client";

import { useState } from "react";
import { TrackInfo } from "@/types";

const API_URL = "http://localhost:8000";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchTracks = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const response = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to search tracks");
      }

      const data = await response.json();
      setSearchResults(data.tracks);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    searchTracks,
  };
}

