"use client";

import { useState, useCallback, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { getSuggestions } from "@/lib/api";
import type { SearchSuggestion } from "@/types";

interface SearchBarProps {
  initialQuery?: string;
  initialYear?: string;
  large?: boolean;
  className?: string;
  showYearFilter?: boolean;
}

// Detect citation patterns
function detectQueryType(query: string): "citation" | "section" | "case_number" | "keyword" {
  const trimmed = query.trim();
  
  // Citation patterns: "2006 SCMR 109", "PLD 2023 SC 1", "2023 MLD 1"
  if (/\d{4}\s+(SCMR|PLD|MLD|CLC|CLD|YLR|PCrLJ|MLD|SCC|SCR)\s+\d+/i.test(trimmed)) {
    return "citation";
  }
  
  // Section patterns: "489-F PPC", "Article 199", "Section 302"
  if (/^(Section|Article|Sec|Art|S)\s*\d+/i.test(trimmed) || /^\d+[-A-Z]?\s+(PPC|CrPC|PECA|QSO|PO|CS|CP|AC|CrPC|CPC|Evidence|Contract|Specific Relief)/i.test(trimmed)) {
    return "section";
  }
  
  // Case number patterns: "Crl.A 123/2023", "W.P 456/2022"
  if (/^(Crl|W\.?P|C\.?P|A\.?C|C\.?A|FAO|APA|CP|OP|MP|IA|Misc)\.?\s*[A-Z]?\s*\d+/i.test(trimmed)) {
    return "case_number";
  }
  
  return "keyword";
}

const typeIndicators: Record<string, { label: string; color: string }> = {
  citation: { label: "Citation", color: "bg-pk-gold-100 text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300" },
  section: { label: "Section", color: "bg-pk-green-100 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300" },
  case_number: { label: "Case No.", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
  keyword: { label: "Search", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

export default function SearchBar({ initialQuery = "", initialYear = "", large = false, className = "", showYearFilter = false }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const queryType = detectQueryType(query);
  const typeInfo = typeIndicators[queryType];

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const result = await getSuggestions(q);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedIndex(-1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    },
    [fetchSuggestions]
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;
      setShowSuggestions(false);
      let url = `/search?q=${encodeURIComponent(query.trim())}`;
      if (selectedYear) {
        url += `&year=${selectedYear}`;
      }
      router.push(url);
    },
    [query, selectedYear, router]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) {
        if (e.key === "Enter") handleSubmit();
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
          if (selectedIndex >= 0) {
            setQuery(suggestions[selectedIndex].text);
            setShowSuggestions(false);
            let url = `/search?q=${encodeURIComponent(suggestions[selectedIndex].text)}`;
            if (selectedYear) {
              url += `&year=${selectedYear}`;
            }
            router.push(url);
          } else {
            handleSubmit();
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleSubmit, selectedYear, router]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const typeLabels: Record<string, string> = {
    citation: "Citation",
    section: "Section",
    keyword: "Keyword",
    case_number: "Case No.",
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div
        className={`relative flex items-center rounded-xl border border-zinc-300 bg-white shadow-sm transition-all focus-within:border-pk-green-500 focus-within:ring-2 focus-within:ring-pk-green-500/20 dark:border-pk-green-700 dark:bg-pk-green-950 dark:focus-within:border-pk-green-400 dark:focus-within:ring-pk-green-400/30 ${
          large ? "h-16" : "h-12"
        }`}
      >
        <svg
          className={`ml-4 shrink-0 text-zinc-400 dark:text-pk-green-500 ${large ? "h-6 w-6" : "h-5 w-5"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        
        {/* Query type indicator */}
        {query.length > 0 && (
          <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder='Enter citation, section, or keyword... (e.g., "2006 SCMR 109", "489-F PPC", "Article 199")'
          className={`flex-1 border-0 bg-transparent px-3 text-zinc-900 placeholder-zinc-400 outline-none dark:text-pk-green-100 dark:placeholder-pk-green-600 ${
            large ? "text-lg" : "text-base"
          }`}
          autoComplete="off"
        />
        
        {/* Year filter */}
        {showYearFilter && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="mr-2 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 outline-none focus:border-pk-green-500 focus:ring-1 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:focus:border-pk-green-400"
          >
            <option value="">All Years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
        
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedYear("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-pk-green-500 dark:hover:bg-pk-green-900 dark:hover:text-pk-green-300"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="mr-2 rounded-lg bg-pk-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pk-green-700 focus-visible:ring-2 focus-visible:ring-pk-green-500 focus-visible:ring-offset-2 dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400 dark:focus-visible:ring-pk-green-400 dark:focus-visible:ring-offset-pk-green-950"
        >
          Search
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2 shadow-lg dark:border-pk-green-700 dark:bg-pk-green-950 dark:shadow-pk-green-950/50">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(s.text);
                setShowSuggestions(false);
                let url = `/search?q=${encodeURIComponent(s.text)}`;
                if (selectedYear) {
                  url += `&year=${selectedYear}`;
                }
                router.push(url);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-pk-green-50 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-200"
                  : "text-zinc-700 hover:bg-zinc-50 dark:text-pk-green-300 dark:hover:bg-pk-green-900/50"
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  s.type === "citation"
                    ? "bg-pk-gold-100 text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                    : "bg-pk-green-100 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300"
                }`}
              >
                {typeLabels[s.type]}
              </span>
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
