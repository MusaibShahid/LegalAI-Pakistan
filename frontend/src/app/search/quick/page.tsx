"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { search } from "@/lib/api";
import type { SearchResult } from "@/types";
import Link from "next/link";

const SUGGESTED_QUERIES = [
  { label: "2024 SCMR 123", icon: "⚖️", desc: "Supreme Court judgment" },
  { label: "PPC 302", icon: "📜", desc: "Penal Code section" },
  { label: "Article 199", icon: "📋", desc: "Constitution article" },
  { label: "489-F PPC", icon: "💳", desc: "Cheque dishonor" },
  { label: "PLD 2023 SC 1", icon: "📕", desc: "PLD citation" },
  { label: "Section 21 PECA", icon: "💻", desc: "Cybercrime law" },
  { label: "Bail", icon: "🔓", desc: "Bail jurisprudence" },
  { label: "Suo Motu", icon: "⚡", desc: "SC original jurisdiction" },
];

const REPORT_QUERIES = [
  { label: "Latest cases", desc: "Recent judgments by date" },
  { label: "Landmark decisions", desc: "Important constitutional cases" },
  { label: "Tax cases", desc: "Recent tax law judgments" },
  { label: "Family law", desc: "Family and custody cases" },
];

export default function QuickSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeQuickSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    setLoading(true);
    try {
      const data = await search(q, {}, 1);
      setResults(data.results.slice(0, 8));
      setShowResults(true);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(() => executeQuickSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, executeQuickSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        } else if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
        break;
      case "Escape":
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  const navigateToResult = (result: SearchResult) => {
    const path = result.type === "law" ? `/law/${result.id}` : `/judgment/${result.id}`;
    router.push(path);
  };

  const selectQuery = (q: string) => {
    setQuery(q);
    executeQuickSearch(q);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 dark:bg-indigo-900/40">
            <span className="text-lg">⚡</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Quick Search</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-pk-green-100">
            Instant Legal Lookup
          </h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-pk-green-400">
            Type a citation, section number, or keyword &mdash; results appear instantly
          </p>
        </div>

        {/* Search Input (Command Palette Style) */}
        <div className="relative">
          <div className="relative flex items-center rounded-2xl border-2 border-indigo-300 bg-white shadow-lg transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 dark:border-indigo-700 dark:bg-pk-green-950 dark:focus-within:border-indigo-400 h-16">
            <span className="ml-5 text-xl text-indigo-500">⚡</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search anything: "2024 SCMR 123", "PPC 302", "Supreme Court bail"...'
              className="flex-1 border-0 bg-transparent px-4 text-lg text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600"
            />
            {loading && (
              <div className="mr-4 h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            )}
            {!loading && query.trim() && (
              <button onClick={() => { setQuery(""); setResults([]); setShowResults(false); inputRef.current?.focus(); }}
                className="mr-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-pk-green-500 dark:hover:bg-pk-green-800">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {query.trim() && (
              <button onClick={() => router.push(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="mr-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:text-indigo-950">
                Full Search
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {showResults && results.length > 0 && (
            <div ref={resultsRef}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-pk-green-700 dark:bg-pk-green-950">
              <div className="border-b border-zinc-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-pk-green-800 dark:text-pk-green-500">
                Quick Results
              </div>
              <div className="max-h-80 overflow-y-auto">
                {results.map((result, i) => (
                  <button
                    key={result.id}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-indigo-50 dark:bg-indigo-900/30"
                        : "hover:bg-zinc-50 dark:hover:bg-pk-green-900/50"
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs dark:bg-pk-green-800">
                      {result.type === "law" ? "📋" : "⚖️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 truncate dark:text-pk-green-100">
                          {result.title}
                        </span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          result.type === "law"
                            ? "bg-pk-green-100 text-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300"
                            : "bg-pk-gold-100 text-pk-gold-700 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                        }`}>
                          {result.type === "law" ? "Law" : "Judgment"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1 dark:text-pk-green-400">
                        {result.description || result.citation || result.court}
                      </p>
                    </div>
                    <span className="mt-1 shrink-0 text-[11px] text-zinc-400 dark:text-pk-green-500">
                      {result.type === "law" ? result.citation : result.court?.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-100 px-4 py-2 text-center dark:border-pk-green-800">
                <button onClick={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View all results &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Grid */}
        {!showResults && (
          <div className="mt-10">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-pk-green-200">
                Suggested Searches
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SUGGESTED_QUERIES.map((sq) => (
                  <button key={sq.label} onClick={() => selectQuery(sq.label)}
                    className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-all hover:border-indigo-200 hover:shadow-sm dark:border-pk-green-800 dark:bg-pk-green-900/50 dark:hover:border-indigo-700">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-base group-hover:bg-indigo-100 dark:bg-indigo-900/30 dark:group-hover:bg-indigo-900/50">
                      {sq.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-pk-green-100">{sq.label}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-pk-green-400">{sq.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-pk-green-200">
                Quick Reports
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {REPORT_QUERIES.map((rq) => (
                  <button key={rq.label} onClick={() => selectQuery(rq.label)}
                    className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:text-pk-green-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300">
                    {rq.desc}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-5 dark:border-pk-green-800 dark:bg-pk-green-950">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                Keyboard Shortcuts
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { keys: "↑ ↓", action: "Navigate results" },
                  { keys: "Enter", action: "Open selected" },
                  { keys: "Esc", action: "Close / Clear" },
                  { keys: "Type", action: "Instant search" },
                ].map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center gap-2">
                    <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-mono text-zinc-600 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300">
                      {shortcut.keys}
                    </kbd>
                    <span className="text-xs text-zinc-500 dark:text-pk-green-400">{shortcut.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-zinc-400 dark:text-pk-green-500">
                <span className="font-medium text-zinc-500 dark:text-pk-green-400">Pro tip:</span> Use the dedicated search engines for deeper filtering —{" "}
                <Link href="/search/caselaw" className="text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Caselaw</Link>
                {" · "}
                <Link href="/search/statutes" className="text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Statutes</Link>
                {" · "}
                <Link href="/search/citation" className="text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Citations</Link>
                {" · "}
                <Link href="/search/advanced" className="text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Advanced</Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
