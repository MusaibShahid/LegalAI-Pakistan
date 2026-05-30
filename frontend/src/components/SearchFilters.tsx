"use client";

import { useState } from "react";
import type { SearchFilters as Filters } from "@/types";

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  className?: string;
}

const COURT_OPTIONS = [
  "Supreme Court of Pakistan",
  "Lahore High Court",
  "Sindh High Court",
  "Islamabad High Court",
  "Peshawar High Court",
  "Balochistan High Court",
];

const COURT_LEVELS = ["Supreme Court", "High Court", "Tribunal", "Special Court"];

const CASE_TYPES = [
  "Civil",
  "Criminal",
  "Constitutional",
  "Service",
  "Tax",
  "Banking",
  "Family",
  "Property",
];

export default function SearchFilters({ filters, onChange, className = "" }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const updateFilter = (key: keyof Filters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const clearAll = () => {
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white dark:border-pk-green-800 dark:bg-pk-green-950 ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 dark:text-pk-green-200"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-zinc-500 dark:text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-pk-green-100 px-2 py-0.5 text-[10px] font-medium text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300">
              Active
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-zinc-500 transition-transform dark:text-pk-green-500 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-pk-green-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Court</label>
              <select
                value={filters.court || ""}
                onChange={(e) => updateFilter("court", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:placeholder-pk-green-500 dark:focus:border-pk-green-400 dark:focus:ring-pk-green-400/50"
              >
                <option value="">All Courts</option>
                {COURT_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Year</label>
              <select
                value={filters.year || ""}
                onChange={(e) => updateFilter("year", e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:focus:border-pk-green-400 dark:focus:ring-pk-green-400/50"
              >
                <option value="">All Years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Court Level</label>
              <select
                value={filters.courtLevel || ""}
                onChange={(e) => updateFilter("courtLevel", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:focus:border-pk-green-400 dark:focus:ring-pk-green-400/50"
              >
                <option value="">All Levels</option>
                {COURT_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Case Type</label>
              <select
                value={filters.caseType || ""}
                onChange={(e) => updateFilter("caseType", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:focus:border-pk-green-400 dark:focus:ring-pk-green-400/50"
              >
                <option value="">All Types</option>
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Judge</label>
              <input
                type="text"
                value={filters.judge || ""}
                onChange={(e) => updateFilter("judge", e.target.value)}
                placeholder="Search by judge name..."
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none placeholder-zinc-400 focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:placeholder-pk-green-500 dark:focus:border-pk-green-400 dark:focus:ring-pk-green-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-pk-green-400">Law / Subject</label>
              <input
                type="text"
                value={filters.law || ""}
                onChange={(e) => updateFilter("law", e.target.value)}
                placeholder="e.g., PPC, CrPC, PECA..."
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none placeholder-zinc-400 focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-200 dark:placeholder-pk-green-500 dark:focus:border-pk-green-400 dark:focus:ring-pk-green-400/50"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mt-3 text-xs font-medium text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
