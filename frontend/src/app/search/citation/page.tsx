"use client";

import { useState } from "react";
import { parseAndSearchCitation, type ParsedCitation } from "@/lib/api";

const EXAMPLE_CITATIONS = [
  "2006 SCMR 109",
  "PLD 2023 SC 1",
  "2024 PCrLJ 156",
  "YLR 2022 2345",
  "2023 CLC 456",
  "2024 MLD 789",
];

export default function CitationSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<ParsedCitation[]>([]);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseAndSearchCitation(query.trim());
      setCitations(result.citations_found.length > 0 ? result.citations_found : result.parsed ? [result.parsed] : []);
      setMessage(result.message);
      if (!result.parsed && result.citations_found.length === 0) {
        setError("Could not parse this citation. Try a standard format like '2006 SCMR 109'.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Citation lookup failed.");
      setCitations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded bg-pk-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">Citation Search</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-pk-green-100">Citation Lookup Engine</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">
            Look up exact legal citations. Supports all major Pakistani law reporters.
          </p>

          <div className="mt-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <div className="relative flex items-center rounded-xl border-2 border-pk-gold-300 bg-white shadow-sm transition-all focus-within:border-pk-gold-500 focus-within:ring-2 focus-within:ring-pk-gold-500/20 dark:border-pk-gold-700 dark:bg-pk-green-950 dark:focus-within:border-pk-gold-400 h-14">
                <svg className="ml-4 h-6 w-6 shrink-0 text-pk-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Enter citation: "2006 SCMR 109", "PLD 2023 SC 1"...'
                  className="flex-1 border-0 bg-transparent px-3 text-lg text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600" />
                <button type="submit" disabled={loading}
                  className="mr-2 rounded-lg bg-pk-gold-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pk-gold-700 disabled:opacity-50 dark:bg-pk-gold-500 dark:text-pk-gold-950">
                  {loading ? "Looking up..." : "Look Up"}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 dark:text-pk-green-500">Examples:</span>
            {EXAMPLE_CITATIONS.map((c) => (
              <button key={c} onClick={() => { setQuery(c); setTimeout(() => handleSearch(), 100); }}
                className="rounded-full border border-pk-gold-200 bg-pk-gold-50/50 px-2.5 py-1 text-xs font-medium text-pk-gold-700 transition-colors hover:border-pk-gold-300 hover:bg-pk-gold-100 dark:border-pk-gold-800 dark:bg-pk-gold-900/20 dark:text-pk-gold-300">
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-pk-gold-200 bg-pk-gold-50/50 px-5 py-4 dark:border-pk-gold-800 dark:bg-pk-gold-900/20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-pk-gold-400 border-t-transparent" />
            <span className="text-sm font-medium text-pk-gold-700 dark:text-pk-gold-400">Looking up citation across free court sources...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-700 dark:bg-red-800 dark:text-red-300">!</span>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Citation Results */}
        {!loading && citations.length > 0 && (
          <div className="space-y-4">
            {message && (
              <div className="rounded-lg border border-pk-green-200 bg-pk-green-50/50 px-4 py-3 text-sm text-pk-green-800 dark:border-pk-green-800 dark:bg-pk-green-900/30 dark:text-pk-green-300">
                {message}
              </div>
            )}
            {citations.map((citation, i) => (
              <div key={i} className="rounded-xl border border-pk-gold-200 bg-white p-5 shadow-sm dark:border-pk-gold-800 dark:bg-pk-gold-950">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-pk-gold-100 px-3 py-1 text-sm font-bold text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">
                    {citation.reporter} {citation.year} {citation.page}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-pk-green-400">Court: {citation.court || "Unknown"}</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    {Math.round(citation.confidence * 100)}% confidence
                  </span>
                </div>

                {/* Parsed Details */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-pk-green-900/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Year</p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-200">{citation.year}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-pk-green-900/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Reporter</p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-200">{citation.reporter}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-pk-green-900/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Page</p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-pk-green-200">{citation.page}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-pk-green-900/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Raw</p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-800 truncate dark:text-pk-green-200" title={citation.raw}>{citation.raw}</p>
                  </div>
                </div>

                {/* Source Links */}
                {citation.search_urls.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-pk-green-400">View on free sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {citation.search_urls.map((source, j) => (
                        <a key={j} href={source.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-pk-green-200 bg-pk-green-50 px-3 py-1.5 text-[11px] font-medium text-pk-green-700 transition-colors hover:border-pk-green-300 hover:bg-pk-green-100 dark:border-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-300 dark:hover:border-pk-green-600">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          {source.source}
                          <span className="text-[9px] text-pk-green-500 dark:text-pk-green-500">({source.search_type})</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && citations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pk-gold-50 to-pk-green-50 dark:from-pk-gold-900/30 dark:to-pk-green-900/30">
              <svg className="h-10 w-10 text-pk-gold-600 dark:text-pk-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Citation Lookup</h3>
            <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-pk-green-400">
              Enter a standard legal citation above. Supports SCMR, PLD, YLR, PCrLJ, CLC, MLD and more.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-pk-green-500">
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">SCMR</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">PLD</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">YLR</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">PCrLJ</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">CLC</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">MLD</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-pk-green-900">PTD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
