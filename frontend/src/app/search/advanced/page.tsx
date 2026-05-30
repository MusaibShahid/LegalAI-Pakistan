"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { search } from "@/lib/api";
import ResultCard from "@/components/ResultCard";
import Pagination from "@/components/Pagination";
import type { SearchResponse } from "@/types";

const COURT_OPTIONS = ["", "Supreme Court of Pakistan", "Lahore High Court", "Sindh High Court", "Islamabad High Court", "Peshawar High Court", "Balochistan High Court", "Federal Shariat Court"];
const CASE_TYPES = ["", "Civil", "Criminal", "Constitutional", "Service", "Tax", "Banking", "Family", "Property"];
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => currentYear - i);

interface AdvancedFilters {
  keywords: string;
  citation: string;
  court: string;
  judge: string;
  yearFrom: string;
  yearTo: string;
  caseType: string;
  caseNumber: string;
  law: string;
  section: string;
  booleanOp: "AND" | "OR";
}

export default function AdvancedSearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<AdvancedFilters>({
    keywords: "", citation: "", court: "", judge: "", yearFrom: "", yearTo: "",
    caseType: "", caseNumber: "", law: "", section: "", booleanOp: "AND",
  });
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  const updateFilter = (key: keyof AdvancedFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildQuery = useCallback((): string => {
    const parts: string[] = [];
    if (filters.keywords.trim()) parts.push(filters.keywords.trim());
    if (filters.citation.trim()) parts.push(filters.citation.trim());
    if (filters.caseNumber.trim()) parts.push(filters.caseNumber.trim());
    if (filters.section.trim()) parts.push(filters.section.trim());
    if (parts.length === 0) return "";
    return parts.join(` ${filters.booleanOp} `);
  }, [filters]);

  const executeSearch = useCallback(async () => {
    const q = buildQuery();
    if (!q) { setError("Please enter at least one search field."); return; }
    setLoading(true); setError(null);
    try {
      const result = await search(q, {
        court: filters.court || undefined,
        judge: filters.judge || undefined,
        year: filters.yearFrom ? Number(filters.yearFrom) : undefined,
        caseType: filters.caseType || undefined,
        law: filters.law || undefined,
        ...(filters.section ? { subject: filters.section } : {}),
      }, page);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, buildQuery]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Advanced Search</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-pk-green-100">Multi-Field Legal Search</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">Combine multiple criteria for precise legal research</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-pk-green-800 dark:bg-pk-green-950">
              <button onClick={() => setShowFilters(!showFilters)} className="flex w-full items-center justify-between text-sm font-semibold text-zinc-700 dark:text-pk-green-200">
                <span>Search Criteria</span>
                <svg className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showFilters && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Keywords</label>
                    <input type="text" value={filters.keywords} onChange={(e) => updateFilter("keywords", e.target.value)} placeholder="e.g., bail, murder, tax..."
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Citation</label>
                    <input type="text" value={filters.citation} onChange={(e) => updateFilter("citation", e.target.value)} placeholder="e.g., 2024 SCMR 123"
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Case Number</label>
                    <input type="text" value={filters.caseNumber} onChange={(e) => updateFilter("caseNumber", e.target.value)} placeholder="e.g., Crl.A 123/2024"
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Court</label>
                    <select value={filters.court} onChange={(e) => updateFilter("court", e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                      {COURT_OPTIONS.map((c) => <option key={c} value={c}>{c || "All Courts"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Judge</label>
                    <input type="text" value={filters.judge} onChange={(e) => updateFilter("judge", e.target.value)} placeholder="e.g., Justice A"
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Year From</label>
                      <select value={filters.yearFrom} onChange={(e) => updateFilter("yearFrom", e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                        <option value="">Any</option>
                        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">To</label>
                      <select value={filters.yearTo} onChange={(e) => updateFilter("yearTo", e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                        <option value="">Any</option>
                        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Case Type</label>
                    <select value={filters.caseType} onChange={(e) => updateFilter("caseType", e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200">
                      {CASE_TYPES.map((t) => <option key={t} value={t}>{t || "All Types"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Law / Statute</label>
                    <input type="text" value={filters.law} onChange={(e) => updateFilter("law", e.target.value)} placeholder="e.g., PPC, CrPC, PECA"
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Section / Article</label>
                    <input type="text" value={filters.section} onChange={(e) => updateFilter("section", e.target.value)} placeholder="e.g., 302, 489-F, 199"
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Boolean Operator</label>
                    <div className="mt-1 flex gap-2">
                      <button onClick={() => updateFilter("booleanOp", "AND")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${filters.booleanOp === "AND" ? "bg-pk-green-600 text-white" : "border border-zinc-300 text-zinc-600 hover:border-pk-green-200 dark:border-pk-green-700 dark:text-pk-green-300"}`}>AND</button>
                      <button onClick={() => updateFilter("booleanOp", "OR")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${filters.booleanOp === "OR" ? "bg-pk-green-600 text-white" : "border border-zinc-300 text-zinc-600 hover:border-pk-green-200 dark:border-pk-green-700 dark:text-pk-green-300"}`}>OR</button>
                    </div>
                  </div>
                  <button onClick={() => { setPage(1); executeSearch(); }} disabled={loading}
                    className="mt-2 w-full rounded-lg bg-pk-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pk-green-700 disabled:opacity-50 dark:bg-pk-green-500 dark:text-pk-green-950">
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

            {loading && <div className="flex items-center justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-pk-green-100 border-t-pk-green-600" /></div>}

            {!loading && data && (
              <>
                <p className="mb-4 text-sm text-zinc-500 dark:text-pk-green-400">
                  <span className="font-semibold text-zinc-800 dark:text-pk-green-100">{data.total}</span> result{data.total !== 1 ? "s" : ""} found
                </p>
                <div className="flex flex-col gap-4">
                  {data.results.map((r) => <ResultCard key={r.id} result={r} />)}
                </div>
                {data.total > data.page_size && (
                  <div className="mt-6 flex justify-center">
                    <Pagination currentPage={page} total={data.total} pageSize={data.page_size} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}

            {!loading && !data && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-pk-green-50 dark:from-blue-900/30 dark:to-pk-green-900/30">
                  <svg className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Advanced Search</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">Combine multiple fields for precise legal research with boolean operators</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
