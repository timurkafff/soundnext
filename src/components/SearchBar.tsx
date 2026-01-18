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
    <div className="glass rounded-3xl p-4 shadow-2xl transition-all duration-300 search-glow">
      <div className="relative group">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for music..."
          className="w-full pl-12 pr-12 py-4 bg-black/40 border border-neutral-700/50 rounded-2xl focus:outline-none focus:border-neutral-500/50 transition-all placeholder-neutral-500 text-white"
        />
        <svg
          className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
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
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-neutral-500/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 animate-fadeIn flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
