"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import ResultCard from "@/components/ResultCard";
import Pagination from "@/components/Pagination";
import { search } from "@/lib/api";
import type { SearchResponse, SearchFilters } from "@/types";

const COURT_OPTIONS = [
  { value: "", label: "All Courts" },
  { value: "Supreme Court of Pakistan", label: "Supreme Court" },
  { value: "Lahore High Court", label: "Lahore High Court" },
  { value: "Sindh High Court", label: "Sindh High Court" },
  { value: "Islamabad High Court", label: "Islamabad High Court" },
  { value: "Peshawar High Court", label: "Peshawar High Court" },
  { value: "Balochistan High Court", label: "Balochistan High Court" },
  { value: "Federal Shariat Court", label: "Federal Shariat Court" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => currentYear - i);

const CASE_TYPES = ["Civil", "Criminal", "Constitutional", "Service", "Tax", "Banking", "Family", "Property"];

function CaselawContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [court, setCourt] = useState(searchParams.get("court") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [judge, setJudge] = useState("");
  const [caseType, setCaseType] = useState("");
  const [inputValue, setInputValue] = useState(query);

  const executeSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const filters: SearchFilters = {};
      if (court) filters.court = court;
      if (year) filters.year = Number(year);
      if (judge) filters.judge = judge;
      if (caseType) filters.caseType = caseType;
      const result = await search(query, filters, page);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, [query, court, year, judge, caseType, page]);

  useEffect(() => {
    if (query.trim()) executeSearch();
    else setData(null);
  }, [query, executeSearch]);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const params = new URLSearchParams();
    params.set("q", inputValue.trim());
    router.push(`/search/caselaw?${params.toString()}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded bg-pk-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">Caselaw Search</span>
          </div>
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center rounded-xl border border-zinc-300 bg-white shadow-sm transition-all focus-within:border-pk-gold-500 focus-within:ring-2 focus-within:ring-pk-gold-500/20 dark:border-pk-green-700 dark:bg-pk-green-950 dark:focus-within:border-pk-gold-400 h-12">
              <svg className="ml-4 h-5 w-5 shrink-0 text-zinc-400 dark:text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder='Search case law: "2024 SCMR 123", "Supreme Court bail", "PLD 2023 SC 1"...'
                className="flex-1 border-0 bg-transparent px-3 text-base text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600"
              />
              <button type="submit" className="mr-2 rounded-lg bg-pk-gold-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pk-gold-700 dark:bg-pk-gold-500 dark:text-pk-gold-950">Search</button>
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-pk-green-500">
            Search only case law — Supreme Court, High Courts, and Tribunals
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-pk-green-800 dark:bg-pk-green-950">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Filters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Court</label>
                  <select value={court} onChange={(e) => { setCourt(e.target.value); setPage(1); }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-gold-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                    {COURT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Year</label>
                  <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-gold-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                    <option value="">All Years</option>
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Judge</label>
                  <input type="text" value={judge} onChange={(e) => setJudge(e.target.value)} placeholder="e.g., Justice A..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none placeholder-zinc-400 focus:border-pk-gold-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:placeholder-pk-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Case Type</label>
                  <select value={caseType} onChange={(e) => { setCaseType(e.target.value); setPage(1); }}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-gold-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                    <option value="">All Types</option>
                    {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-pk-gold-100 border-t-pk-gold-600 dark:border-pk-gold-800 dark:border-t-pk-gold-400" />
              </div>
            )}

            {!loading && !error && data && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-zinc-500 dark:text-pk-green-400">
                    <span className="font-semibold text-zinc-800 dark:text-pk-green-100">{data.total}</span> case{data.total !== 1 ? "s" : ""} found
                    {data.query && <> for &ldquo;<span className="font-medium text-pk-gold-700 dark:text-pk-gold-300">{data.query}</span>&rdquo;</>}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {data.results.map((r) => <ResultCard key={r.id} result={r} />)}
                </div>
                <div className="mt-6 flex justify-center">
                  <Pagination currentPage={page} total={data.total} pageSize={data.page_size} onPageChange={setPage} />
                </div>
              </>
            )}

            {!loading && !data && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pk-gold-50 to-pk-green-50 dark:from-pk-gold-900/30 dark:to-pk-green-900/30">
                  <svg className="h-10 w-10 text-pk-gold-600 dark:text-pk-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Case Law Search</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">Search across all Pakistani courts — Supreme Court, High Courts, and Tribunals</p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {["2024 SCMR 123", "PLD 2023 SC 1", "2024 PCrLJ 156", "Supreme Court bail"].map((s) => (
                    <button key={s} onClick={() => { setInputValue(s); router.push(`/search/caselaw?q=${encodeURIComponent(s)}`); }}
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

export default function CaselawPage() {
  return <Suspense><CaselawContent /></Suspense>;
}
