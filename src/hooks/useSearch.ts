"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TrackInfo } from "@/types";

const API_URL = "http://localhost:8000";

// Кэш результатов поиска
const searchCache = new Map<string, { tracks: TrackInfo[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const searchTracks = useCallback(async (query?: string) => {
    const q = (query ?? searchQuery).trim();
    
    if (!q) {
      setError("Please enter a search query");
      return;
    }

    // Проверяем кэш
    const cached = searchCache.get(q.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setSearchResults(cached.tracks);
      setError("");
      return;
    }

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(q)}&limit=30`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to search tracks");
      }

      const data = await response.json();
      
      // Сохраняем в кэш
      searchCache.set(q.toLowerCase(), {
        tracks: data.tracks,
        timestamp: Date.now()
      });
      
      setSearchResults(data.tracks);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Автопоиск с debounce при изменении запроса
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        searchTracks(searchQuery);
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    searchTracks,
  };
}

