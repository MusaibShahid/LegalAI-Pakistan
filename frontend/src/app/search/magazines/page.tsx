"use client";

import { useState, useEffect, useCallback } from "react";

interface MagazineSearchResult {
  id: string;
  title: string;
  magazine_name: string;
  year: number | null;
  author: string | null;
  topic: string | null;
  description: string | null;
  volume: string | null;
  issue: string | null;
  source_url: string | null;
}

interface MagazineSearchResponse {
  results: MagazineSearchResult[];
  total: number;
  query: string;
  page: number;
  page_size: number;
}

const TOPICS = [
  "All Topics",
  "Constitutional Law",
  "Criminal Procedure",
  "Cyber Law",
  "Environmental Law",
  "Family Law",
  "International Law",
  "Tax Law",
  "Corporate Law",
  "Banking Law",
  "Service Law",
  "Human Rights",
  "Legal Theory",
  "Media Law",
  "ADR",
];

const SAMPLE_MAGAZINES = [
  "Pakistan Law Journal (PLJ)",
  "Monthly Law Digest (MLD)",
  "Civil Law Cases (CLC) Journal",
  "Pakistan Legal Decisions (PLD) Journal",
  "Supreme Court Quarterly Review",
  "Yearly Law Reports (YLR) Magazine",
  "Criminal Law Journal",
  "Federal Judicial Academy Journal",
];

const SUGGESTED_ARTICLES = [
  "Landmark Supreme Court Decisions",
  "Cybercrime Laws",
  "Environmental Justice",
  "Women's Property Rights",
  "Doctrine of Precedent",
  "Alternative Dispute Resolution",
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MagazinesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MagazineSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [topic, setTopic] = useState("");
  const [magazineName, setMagazineName] = useState("");
  const [year, setYear] = useState("");
  const [author, setAuthor] = useState("");

  const pageSize = 12;

  const searchMagazines = useCallback(async (q: string, p: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      /* Exclude the q param when empty — the backend will return all articles filtered by filters only */
      params.set("page", String(p));
      params.set("page_size", String(pageSize));
      if (topic) params.set("topic", topic);
      if (magazineName) params.set("magazine_name", magazineName);
      if (year) params.set("year", year);
      if (author.trim()) params.set("author", author.trim());

      const res = await fetch(`${API_BASE}/api/magazines/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const data: MagazineSearchResponse = await res.json();
      setResults((prev) => (append ? [...prev, ...data.results] : data.results));
      setTotal(data.total);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search magazines.");
    } finally {
      setLoading(false);
    }
  }, [topic, magazineName, year, author]);

  useEffect(() => {
    if (!query.trim() && !topic && !magazineName && !year && !author.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    searchMagazines(query, 1, false);
  }, [query, topic, magazineName, year, author, searchMagazines]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMagazines(query, 1, false);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300">
              Magazine Search
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-pk-green-100">
            Legal Magazine &amp; Journal Articles
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">
            Browse articles from PLJ, MLD, CLC, PLD, YLR, and other legal publications
          </p>

          <form onSubmit={handleSearch} className="mt-6">
            <div className="flex items-center rounded-xl border border-zinc-300 bg-white shadow-sm transition-all focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 dark:border-pk-green-700 dark:bg-pk-green-950 h-12">
              <span className="ml-4 text-lg">📰</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search articles: "Landmark decisions", "Cybercrime", "Environmental"...'
                className="flex-1 border-0 bg-transparent px-3 text-base text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600"
              />
              <button type="submit" disabled={loading}
                className="mr-2 rounded-lg bg-cyan-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50 dark:bg-cyan-500 dark:text-cyan-950">
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Quick topic chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-zinc-400 dark:text-pk-green-500 self-center">Topics:</span>
            {SUGGESTED_ARTICLES.map((s) => (
              <button key={s} onClick={() => { setQuery(s); searchMagazines(s, 1, false); }}
                className="rounded-full border border-cyan-200 bg-cyan-50/50 px-2.5 py-1 text-xs font-medium text-cyan-700 transition-colors hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters */}
          <aside className="w-full shrink-0 lg:w-56">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-pk-green-800 dark:bg-pk-green-950">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                Filters
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Topic</label>
                  <select value={topic} onChange={(e) => { setTopic(e.target.value); setPage(1); }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-cyan-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                    {TOPICS.map((t) => <option key={t} value={t === "All Topics" ? "" : t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Magazine</label>
                  <select value={magazineName} onChange={(e) => { setMagazineName(e.target.value); setPage(1); }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-cyan-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                    <option value="">All Magazines</option>
                    {SAMPLE_MAGAZINES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Year</label>
                  <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-cyan-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                    <option value="">All Years</option>
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Author</label>
                  <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g., Justice A..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none placeholder-zinc-400 focus:border-cyan-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:placeholder-pk-green-500" />
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">{error}</div>
            )}

            {loading && results.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600 dark:border-cyan-800 dark:border-t-cyan-400" />
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-zinc-500 dark:text-pk-green-400">
                    <span className="font-semibold text-zinc-800 dark:text-pk-green-100">{total}</span> article{total !== 1 ? "s" : ""} found
                    {query && <> for &ldquo;<span className="font-medium text-cyan-700 dark:text-cyan-300">{query}</span>&rdquo;</>}
                  </p>
                  {total > pageSize && (
                    <p className="text-xs text-zinc-400 dark:text-pk-green-500">
                      Page {page} of {Math.ceil(total / pageSize)}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {results.map((article) => (
                    <div key={article.id}
                      className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-cyan-200 hover:shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950 dark:hover:border-cyan-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300">
                              {article.magazine_name}
                            </span>
                            {article.year && (
                              <span className="text-[10px] font-medium text-zinc-400 dark:text-pk-green-500">{article.year}</span>
                            )}
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-zinc-900 leading-snug dark:text-pk-green-100">
                            {article.title}
                          </h3>
                          {article.author && (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-pk-green-400">
                              By <span className="font-medium text-zinc-700 dark:text-pk-green-300">{article.author}</span>
                            </p>
                          )}
                          {article.description && (
                            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 line-clamp-2 dark:text-pk-green-300/70">
                              {article.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-pk-green-800">
                        {article.topic && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-pk-green-800 dark:text-pk-green-300">
                            {article.topic}
                          </span>
                        )}
                        {article.volume && (
                          <span className="text-[10px] text-zinc-400 dark:text-pk-green-500">Vol. {article.volume}{article.issue ? `, Issue ${article.issue}` : ""}</span>
                        )}
                        {article.source_url && (
                          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                            className="ml-auto text-[11px] font-medium text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                            Read &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {results.length < total && (
                  <div className="mt-6 text-center">
                    <button onClick={() => searchMagazines(query, page + 1, true)} disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-6 py-3 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-50 disabled:opacity-50 dark:border-cyan-700 dark:bg-pk-green-950 dark:text-cyan-300 dark:hover:bg-cyan-900/30">
                      {loading ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" /> Loading...</>
                      ) : (
                        <>Load More ({Math.min(pageSize, total - results.length)} more)</>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-50 to-pk-green-50 dark:from-cyan-900/30 dark:to-pk-green-900/30">
                  <span className="text-4xl">📰</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Magazine Articles</h3>
                <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-pk-green-400">
                  Browse legal magazine articles from Pakistan&apos;s top legal publications. Select a topic or search above.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {TOPICS.filter((t) => t !== "All Topics").slice(0, 8).map((t) => (
                    <button key={t} onClick={() => setTopic(t)}
                      className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-medium text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-cyan-700 dark:bg-pk-green-900/50 dark:text-cyan-300">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
