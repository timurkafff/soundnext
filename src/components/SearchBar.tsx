"use client";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onSearch,
  loading,
  error,
}: SearchBarProps) {
  return (
    <div className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-neutral-800 transition-all duration-300 hover:border-neutral-700">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search for music..."
            className="w-full pl-12 pr-6 py-4 bg-black/50 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all placeholder-neutral-600 text-white"
          />
          <svg
            className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <button
          onClick={onSearch}
          disabled={loading}
          className="px-8 py-4 bg-white text-black rounded-2xl font-semibold hover:bg-neutral-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 animate-fadeIn">
          {error}
        </div>
      )}
    </div>
  );
}
