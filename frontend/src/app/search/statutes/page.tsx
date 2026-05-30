"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { search } from "@/lib/api";
import type { SearchResponse } from "@/types";
import Link from "next/link";

function StatutesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lawFilter, setLawFilter] = useState("");
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const executeSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await search(query, { law: lawFilter || undefined }, page);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, [query, lawFilter, page]);

  useEffect(() => {
    if (query.trim()) executeSearch();
    else setData(null);
  }, [query, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    router.push(`/search/statutes?q=${encodeURIComponent(inputValue.trim())}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded bg-pk-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300">Statute Search</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center rounded-xl border border-zinc-300 bg-white shadow-sm transition-all focus-within:border-pk-green-500 focus-within:ring-2 focus-within:ring-pk-green-500/20 dark:border-pk-green-700 dark:bg-pk-green-950 dark:focus-within:border-pk-green-400 h-12">
              <svg className="ml-4 h-5 w-5 shrink-0 text-zinc-400 dark:text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder='Search statutes: "PPC 302", "Article 199", "PECA Section 20"...'
                className="flex-1 border-0 bg-transparent px-3 text-base text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600"
              />
              <button type="submit" className="mr-2 rounded-lg bg-pk-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950">Search</button>
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-pk-green-500">
            Search across Pakistan Code, Penal Code, Constitution, and all federal &amp; provincial statutes
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-pk-green-800 dark:bg-pk-green-950">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Filter by Law</h3>
              <select value={lawFilter} onChange={(e) => { setLawFilter(e.target.value); setPage(1); }}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                <option value="">All Statutes</option>
                <option value="Pakistan Penal Code">Pakistan Penal Code 1860</option>
                <option value="Constitution of Pakistan">Constitution of Pakistan 1973</option>
                <option value="Criminal Procedure Code">Criminal Procedure Code 1898</option>
                <option value="Qanun-e-Shahadat">Qanun-e-Shahadat Order 1984</option>
                <option value="Muslim Family Laws">Muslim Family Laws Ordinance 1961</option>
                <option value="Customs Act">Customs Act 1969</option>
                <option value="Anti Terrorism Act">Anti Terrorism Act 1997</option>
                <option value="Contract Act">Contract Act 1872</option>
                <option value="Transfer of Property">Transfer of Property Act 1882</option>
                <option value="Limitation Act">Limitation Act 1908</option>
                <option value="Companies Act">Companies Act 2017</option>
                <option value="PECA">Prevention of Electronic Crimes Act 2016</option>
                <option value="National Accountability">National Accountability Ordinance 1999</option>
                <option value="Environmental Protection">Environmental Protection Act 1997</option>
              </select>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

            {loading && <div className="flex items-center justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-pk-green-100 border-t-pk-green-600" /></div>}

            {!loading && !error && data && (
              <>
                <p className="mb-4 text-sm text-zinc-500 dark:text-pk-green-400">
                  <span className="font-semibold text-zinc-800 dark:text-pk-green-100">{data.total}</span> statute{data.total !== 1 ? "s" : ""} found
                </p>
                <div className="flex flex-col gap-3">
                  {data.results.map((r) => (
                    <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-pk-green-200 hover:shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950 dark:hover:border-pk-green-600">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-pk-green-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300">Law</span>
                            <span className="text-xs font-medium text-pk-green-700 dark:text-pk-green-400">{r.citation}</span>
                          </div>
                          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-pk-green-100">{r.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-600 line-clamp-3 dark:text-pk-green-300/80">{r.description}</p>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-pk-green-800">
                        <Link href={`/law/${r.id}`} className="text-xs font-medium text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400">
                          View full section &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading && !data && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pk-green-50 to-pk-gold-50 dark:from-pk-green-900/50 dark:to-pk-gold-900/30">
                  <svg className="h-10 w-10 text-pk-green-600 dark:text-pk-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Statute Search</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">Search across Pakistan&apos;s federal and provincial legislation</p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {["PPC 302", "Article 199", "Section 21 PECA", "CrPC 497"].map((s) => (
                    <button key={s} onClick={() => { setInputValue(s); router.push(`/search/statutes?q=${encodeURIComponent(s)}`); }}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-pk-gold-300 hover:text-pk-gold-700 dark:border-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-200 dark:hover:border-pk-gold-600">
                      {s}
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

export default function StatutesPage() {
  return <Suspense><StatutesContent /></Suspense>;
}
