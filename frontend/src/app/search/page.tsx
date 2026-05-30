"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { unifiedSearch, getUnifiedSuggestions } from "@/lib/api";
import type { UnifiedSearchResult, UnifiedSearchResponse, UnifiedSuggestion } from "@/types";
import type { UnifiedSearchFilters } from "@/lib/api";
import { SidebarAd } from "@/components/GoogleAd";

const SECTION_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  judgment: { icon: "⚖️", color: "border-l-pk-gold-500 bg-pk-gold-50/30 dark:bg-pk-gold-900/10", label: "Judgments" },
  law: { icon: "📋", color: "border-l-pk-green-500 bg-pk-green-50/30 dark:bg-pk-green-900/10", label: "Law Sections" },
  magazine: { icon: "📰", color: "border-l-cyan-500 bg-cyan-50/30 dark:bg-cyan-900/10", label: "Magazine Articles" },
};

const SOURCE_TYPE_OPTIONS = [
  { value: "judgment", label: "Judgments", icon: "⚖️" },
  { value: "law", label: "Law Sections", icon: "📋" },
  { value: "magazine", label: "Magazine Articles", icon: "📰" },
];

const COURT_OPTIONS = [
  "Supreme Court of Pakistan",
  "Lahore High Court",
  "Sindh High Court",
  "Islamabad High Court",
  "Peshawar High Court",
  "Balochistan High Court",
];

const EXAMPLE_QUERIES = [
  { q: "PLD 2023 SC 1", desc: "Citation lookup" },
  { q: "PPC 302", desc: "Section search" },
  { q: "Supreme Court bail", desc: "Keyword search" },
  { q: "Environmental law", desc: "Topic search" },
];

function getResultUrl(r: UnifiedSearchResult): string {
  if (r.type === "judgment") return `/judgment/${r.id}`;
  if (r.type === "law") return `/law/${r.id}`;
  return `/search/magazines?q=${encodeURIComponent(r.title)}`;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<UnifiedSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<UnifiedSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter state — uses ref to avoid unstable closure references
  const [filters, setFilters] = useState<UnifiedSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Build active filter display text
  const activeFilterCount = [filters.court, filters.year, filters.source_type].filter(Boolean).length;

  const buildFiltersForApi = useCallback((): UnifiedSearchFilters => {
    return Object.fromEntries(
      Object.entries(filtersRef.current).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
    ) as UnifiedSearchFilters;
  }, []);

  const executeUnifiedSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setData(null); setHasSearched(false); return; }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const activeFilters = buildFiltersForApi();
      const result = await unifiedSearch(q, activeFilters, 6);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildFiltersForApi]);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setData(null); setHasSearched(false); setLoading(false); return; }
    debounceRef.current = setTimeout(() => executeUnifiedSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, executeUnifiedSearch]);

  // Run initial search if query param exists
  useEffect(() => {
    if (initialQuery.trim()) {
      executeUnifiedSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input on mount
  useEffect(() => {
    if (!initialQuery) inputRef.current?.focus();
  }, [initialQuery]);

  // Re-execute search when filters change (if already searched)
  const hasSearchedRef = useRef(hasSearched);
  hasSearchedRef.current = hasSearched;
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    if (hasSearchedRef.current && queryRef.current.trim()) {
      executeUnifiedSearch(queryRef.current);
    }
    // Only run when filters change, not on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, executeUnifiedSearch]);

  // ── Autocomplete suggestions ──

  // Fetch suggestions with 150ms debounce
  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const results = await getUnifiedSuggestions(q);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch {
        // Silently fail — suggestions are non-critical
      }
    }, 150);
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [query]);

  // Close suggestions on click outside
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [showSuggestions]);

  const selectSuggestion = (suggestion: UnifiedSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    const searchText = suggestion.text;
    setQuery(searchText);
    router.push(`/search?q=${encodeURIComponent(searchText)}`, { scroll: false });
    executeUnifiedSearch(searchText);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case "Tab":
        setShowSuggestions(false);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSuggestions([]);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false });
      executeUnifiedSearch(query);
    }
  };

  const selectExample = (q: string) => {
    setQuery(q);
    setShowSuggestions(false);
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    executeUnifiedSearch(q);
    inputRef.current?.focus();
  };

  // Filter helpers
  const updateFilter = (key: keyof UnifiedSearchFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Source type toggle: allow selecting multiple types
  const toggleSourceType = (type: string) => {
    const current = filters.source_type ? filters.source_type.split(",") : [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateFilter("source_type", next.length > 0 && next.length < 3 ? next.join(",") : undefined);
  };

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionResults = (type: string) =>
    data?.results.filter((r) => r.type === type) || [];

  const typeCount = (type: string) => {
    if (!data) return 0;
    if (type === "judgment") return data.categories.judgments;
    if (type === "law") return data.categories.laws;
    if (type === "magazine") return data.categories.magazines;
    return 0;
  };

  const allEmpty = data && data.results.length === 0 && !loading;
  const hasResults = data && data.results.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      {/* Search Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center rounded-2xl border-2 border-pk-green-300 bg-white shadow-lg transition-all focus-within:border-pk-green-500 focus-within:ring-4 focus-within:ring-pk-green-500/20 dark:border-pk-green-700 dark:bg-pk-green-950 h-14 sm:h-16">
              <span className="ml-4 sm:ml-5 text-lg sm:text-xl text-pk-green-600 dark:text-pk-green-400">
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                placeholder='Search everything: citations, sections, keywords, magazines...'
                className="flex-1 border-0 bg-transparent px-3 sm:px-4 text-base sm:text-lg text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600"
              />
              {loading && (
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-pk-green-400 border-t-transparent" />
              )}
              {!loading && query.trim() && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setData(null); setHasSearched(false); inputRef.current?.focus(); }}
                  className="mr-2 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-pk-green-500 dark:hover:bg-pk-green-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className="mr-2 rounded-xl bg-pk-green-600 px-4 sm:px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-pk-green-700 dark:bg-pk-green-700 dark:hover:bg-pk-green-600"
              >
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-pk-green-700 dark:bg-pk-green-950"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.type}-${s.text}`}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      i === selectedIndex
                        ? "bg-pk-green-50 text-pk-green-900 dark:bg-pk-green-800/50 dark:text-pk-green-100"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-pk-green-200 dark:hover:bg-pk-green-900/30"
                    }`}
                  >
                    <span className="shrink-0 text-base">
                      {s.type === "citation" ? "⚖️" : s.type === "section" ? "📋" : "🔍"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.text}</span>
                      {s.label && (
                        <span className="block truncate text-[11px] text-zinc-400 dark:text-pk-green-500">{s.label}</span>
                      )}
                    </div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      s.type === "citation"
                        ? "bg-pk-gold-100 text-pk-gold-700 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                        : s.type === "section"
                        ? "bg-pk-green-100 text-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-300"
                        : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                    }`}>
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Filter Toggle + Active Filters Pills */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showFilters
                  ? "border-pk-green-400 bg-pk-green-50 text-pk-green-700 dark:border-pk-green-600 dark:bg-pk-green-900/50 dark:text-pk-green-300"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-pk-green-300 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-950 dark:text-pk-green-400 dark:hover:border-pk-green-600"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 rounded-full bg-pk-green-200 px-1.5 py-0.5 text-[10px] font-bold text-pk-green-800 dark:bg-pk-green-700 dark:text-pk-green-200">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter pills */}
            {filters.court && (
              <span className="inline-flex items-center gap-1 rounded-full border border-pk-green-200 bg-pk-green-50 px-2.5 py-1 text-[11px] font-medium text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:text-pk-green-300">
                {filters.court.split(" ").slice(0, 2).join(" ")}
                <button onClick={() => updateFilter("court", undefined)} className="ml-0.5 hover:text-pk-green-900 dark:hover:text-pk-green-100">&times;</button>
              </span>
            )}
            {filters.year && (
              <span className="inline-flex items-center gap-1 rounded-full border border-pk-green-200 bg-pk-green-50 px-2.5 py-1 text-[11px] font-medium text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:text-pk-green-300">
                {filters.year}
                <button onClick={() => updateFilter("year", undefined)} className="ml-0.5 hover:text-pk-green-900 dark:hover:text-pk-green-100">&times;</button>
              </span>
            )}
            {filters.source_type && (
              <span className="inline-flex items-center gap-1 rounded-full border border-pk-green-200 bg-pk-green-50 px-2.5 py-1 text-[11px] font-medium text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:text-pk-green-300">
                {filters.source_type.replace(",", " + ")}
                <button onClick={() => updateFilter("source_type", undefined)} className="ml-0.5 hover:text-pk-green-900 dark:hover:text-pk-green-100">&times;</button>
              </span>
            )}

            <p className="text-[11px] text-zinc-400 dark:text-pk-green-500">
              Real-time unified search &mdash; judgments, statutes, citations, magazine articles, and more
            </p>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-pk-green-700 dark:bg-pk-green-950">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Court Filter */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Court
                  </label>
                  <select
                    value={filters.court || ""}
                    onChange={(e) => updateFilter("court", e.target.value || undefined)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:focus:border-pk-green-400"
                  >
                    <option value="">All Courts</option>
                    {COURT_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Year
                  </label>
                  <select
                    value={filters.year || ""}
                    onChange={(e) => updateFilter("year", e.target.value ? Number(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:focus:border-pk-green-400"
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Source Type Filter */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Source Type
                  </label>
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {SOURCE_TYPE_OPTIONS.map((opt) => {
                      const selected = !filters.source_type || filters.source_type.split(",").includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            selected
                              ? "border-pk-green-300 bg-pk-green-50 text-pk-green-700 dark:border-pk-green-600 dark:bg-pk-green-900/40 dark:text-pk-green-300"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-pk-green-700 dark:bg-pk-green-900/10 dark:text-pk-green-500 dark:hover:border-pk-green-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSourceType(opt.value)}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-pk-green-600 focus:ring-pk-green-500 dark:border-pk-green-600 dark:bg-pk-green-900 dark:focus:ring-pk-green-400"
                          />
                          <span>{opt.icon}</span>
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs font-medium text-pk-green-600 transition-colors hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Results */}
        {hasResults && (
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-pk-green-400">
            <span className="font-semibold text-zinc-800 dark:text-pk-green-100">{data?.total}</span> result{data?.total !== 1 ? "s" : ""} for &ldquo;<span className="font-medium text-pk-green-700 dark:text-pk-green-300">{data?.query}</span>&rdquo;
            {activeFilterCount > 0 && (
              <>
                <span className="text-xs text-zinc-400">&middot;</span>
                <span className="text-xs text-zinc-400 dark:text-pk-green-500">{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
              </>
            )}
            <span className="text-xs text-zinc-400 dark:text-pk-green-500">(realtime)</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200 dark:bg-red-800">
                <svg className="h-4 w-4 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Citation Info Card */}
        {data?.citation_info && hasResults && !loading && (
          <div className="mb-6 overflow-hidden rounded-xl border border-pk-green-200 bg-white shadow-sm dark:border-pk-green-700 dark:bg-pk-green-950">
            <div className="flex items-center gap-2 border-b border-pk-green-100 bg-pk-green-50 px-5 py-3 dark:border-pk-green-800 dark:bg-pk-green-900/30">
              <span className="text-lg">📜</span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-pk-green-100">Citation Parsed</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                data.citation_info.confidence >= 0.8
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  : data.citation_info.confidence >= 0.5
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              }`}>
                {Math.round(data.citation_info.confidence * 100)}% match
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-pk-green-500">Reporter</span>
                <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-100">{data.citation_info.reporter}</p>
                {data.citation_info.reporter_full_name && (
                  <p className="text-[11px] text-zinc-500 dark:text-pk-green-400">{data.citation_info.reporter_full_name}</p>
                )}
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-pk-green-500">Year</span>
                <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-100">{data.citation_info.year}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-pk-green-500">Page</span>
                <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-100">{data.citation_info.page}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-pk-green-500">Court</span>
                <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-100">{data.citation_info.court || "Various"}</p>
              </div>
            </div>

            {/* Search URLs */}
            {data.citation_info.search_urls.length > 0 && (
              <div className="border-t border-pk-green-100 px-5 py-3 dark:border-pk-green-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-pk-green-500">Search on external sources</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.citation_info.search_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 transition-colors hover:border-pk-green-300 hover:bg-pk-green-50 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:text-pk-green-300 dark:hover:border-pk-green-600 dark:hover:bg-pk-green-900"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {url.source}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categorized Results */}
        {hasResults && !loading && (
          <div className="flex flex-col gap-6">
            {["judgment", "law", "magazine"].map((type) => {
              const items = sectionResults(type);
              const count = typeCount(type);
              const info = SECTION_ICONS[type];
              const isCollapsed = collapsed[type];
              if (items.length === 0) return null;

              return (
                <div
                  key={type}
                  className={`overflow-hidden rounded-xl border border-zinc-200 dark:border-pk-green-800 border-l-4 ${info.color}`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(type)}
                    className="flex w-full items-center justify-between bg-white px-5 py-3 transition-colors hover:bg-zinc-50 dark:bg-pk-green-950 dark:hover:bg-pk-green-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-pk-green-100">{info.label}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-pk-green-800 dark:text-pk-green-300">
                        {count}
                      </span>
                    </div>
                    <svg
                      className={`h-4 w-4 text-zinc-400 transition-transform dark:text-pk-green-500 ${isCollapsed ? "" : "rotate-180"}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Section Items */}
                  {!isCollapsed && (
                    <div className="divide-y divide-zinc-100 dark:divide-pk-green-800">
                      {items.map((item) => (
                        <Link
                          key={`${item.type}-${item.id}`}
                          href={getResultUrl(item)}
                          className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white dark:hover:bg-pk-green-900/30"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                                item.type === "judgment"
                                  ? "bg-pk-gold-100 text-pk-gold-700 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                                  : item.type === "law"
                                  ? "bg-pk-green-100 text-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-300"
                                  : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                              }`}>
                                {item.type}
                              </span>
                              {item.subtitle && (
                                <span className="text-xs font-medium text-zinc-500 dark:text-pk-green-400">{item.subtitle}</span>
                              )}
                              <span className="text-[11px] text-zinc-400 dark:text-pk-green-500">{item.source}</span>
                              {item.date && (
                                <span className="text-[11px] text-zinc-400 dark:text-pk-green-500">{item.date}</span>
                              )}
                            </div>
                            <h3 className="mt-1 text-sm font-semibold text-zinc-900 group-hover:text-pk-green-700 dark:text-pk-green-100 dark:group-hover:text-pk-green-300 leading-snug">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-2 dark:text-pk-green-300/70">
                                {item.description}
                              </p>
                            )}
                            {item.content_snippet && (
                              <p className="mt-1 text-[11px] italic leading-relaxed text-zinc-400 line-clamp-1 dark:text-pk-green-500/70">
                                &ldquo;{item.content_snippet}&rdquo;
                              </p>
                            )}
                          </div>
                          <svg className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-pk-green-600 dark:text-pk-green-600 dark:group-hover:text-pk-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}

                      {/* View All Link */}
                      <Link
                        href={type === "judgment" ? `/search/caselaw?q=${encodeURIComponent(query)}&court=${filters.court || ""}&year=${filters.year || ""}` : type === "law" ? `/search/statutes?q=${encodeURIComponent(query)}` : `/search/magazines?q=${encodeURIComponent(query)}`}
                        className="flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-medium text-pk-green-600 transition-colors hover:bg-pk-green-50 dark:text-pk-green-400 dark:hover:bg-pk-green-900/30"
                      >
                        View all {info.label.toLowerCase()} &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {allEmpty && !loading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pk-green-50 dark:bg-pk-green-900/50">
              <svg className="h-8 w-8 text-pk-green-400 dark:text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">No results found</h3>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-pk-green-400">No matches across judgments, law sections, or magazine articles. Try different keywords or browse the dedicated search engines below.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {["/search/caselaw", "/search/statutes", "/search/citation", "/search/magazines"].map((path) => (
                <Link key={path} href={path}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-300 dark:hover:bg-pk-green-900"
                >
                  {path.replace("/search/", "").charAt(0).toUpperCase() + path.replace("/search/", "").slice(1)} Search
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && hasSearched && !hasResults && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-pk-green-100 border-t-pk-green-600 dark:border-pk-green-800 dark:border-t-pk-green-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-pk-gold-400/60 dark:bg-pk-gold-500/60" />
              </div>
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-500 dark:text-pk-green-400">Searching across all legal sources...</p>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-400 dark:text-pk-green-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-pk-gold-400" />Judgments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-pk-green-400" />Law Sections
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />Magazine Articles
              </span>
            </div>
          </div>
        )}

        {/* Initial empty state */}
        {!query && !loading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pk-green-50 to-pk-gold-50 shadow-sm dark:from-pk-green-900/50 dark:to-pk-gold-900/30">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-pk-green-100">
              Unified Legal Search
            </h3>
            <p className="mt-1.5 max-w-lg text-center text-sm text-zinc-500 dark:text-pk-green-400">
              Search across <strong className="text-zinc-700 dark:text-pk-green-200">judgments</strong>, <strong className="text-zinc-700 dark:text-pk-green-200">law sections</strong>, and <strong className="text-zinc-700 dark:text-pk-green-200">magazine articles</strong> simultaneously — results appear in real-time as you type.
            </p>

            {/* Example queries */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EXAMPLE_QUERIES.map((ex) => (
                <button
                  key={ex.q}
                  onClick={() => selectExample(ex.q)}
                  className="group rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-all hover:border-pk-gold-300 hover:shadow-sm dark:border-pk-green-800 dark:bg-pk-green-900/30 dark:hover:border-pk-gold-600"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-pk-gold-600 dark:text-pk-gold-400">
                    {ex.desc}
                  </span>
                  <p className="mt-0.5 text-sm text-zinc-700 group-hover:text-pk-green-800 dark:text-pk-green-200 dark:group-hover:text-pk-green-300">{ex.q}</p>
                </button>
              ))}
            </div>

            {/* Quick stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: "⚖️", count: "34+", label: "Judgments" },
                { icon: "📋", count: "31+", label: "Law Sections" },
                { icon: "📰", count: "15+", label: "Magazine Articles" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl">{stat.icon}</div>
                  <div className="mt-1 text-lg font-bold text-zinc-800 dark:text-pk-green-100">{stat.count}</div>
                  <div className="text-[11px] text-zinc-400 dark:text-pk-green-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-xs text-zinc-400 dark:text-pk-green-500">
                <span className="font-medium text-zinc-500 dark:text-pk-green-400">Pro tip:</span> Type any citation, section number, or keyword — results appear instantly. Use the dedicated search engines for deeper filtering.
              </p>

              {/* Non-intrusive ad in empty state */}
              <div className="mt-6">
                <SidebarAd className="max-w-sm mx-auto" />
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  { href: "/search/caselaw", label: "Caselaw" },
                  { href: "/search/statutes", label: "Statutes" },
                  { href: "/search/citation", label: "Citations" },
                  { href: "/search/advanced", label: "Advanced" },
                  { href: "/search/quick", label: "Quick Search" },
                  { href: "/search/magazines", label: "Magazines" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-pk-green-300 hover:bg-pk-green-50 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:text-pk-green-300 dark:hover:border-pk-green-600 dark:hover:bg-pk-green-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-pk-green-100 border-t-pk-green-600 dark:border-pk-green-800 dark:border-t-pk-green-400" />
            <p className="text-sm text-zinc-500 dark:text-pk-green-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
