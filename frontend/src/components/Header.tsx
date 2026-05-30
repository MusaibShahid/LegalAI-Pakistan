"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const SEARCH_ENGINES = [
  { label: "General Search", href: "/search", desc: "All courts & laws" },
  { label: "Caselaw Search", href: "/search/caselaw", desc: "Case law only" },
  { label: "Statute Search", href: "/search/statutes", desc: "Statutes & legislation" },
  { label: "Citation Search", href: "/search/citation", desc: "Citation lookup" },
  { label: "Quick Search", href: "/search/quick", desc: "Instant results" },
  { label: "Advanced Search", href: "/search/advanced", desc: "Multi-field boolean" },
  { label: "Magazine Search", href: "/search/magazines", desc: "Legal journals" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-pk-green-800 dark:bg-pk-green-950/95 dark:supports-[backdrop-filter]:bg-pk-green-950/80">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pk-green-600 to-pk-green-700 text-sm font-bold text-white shadow-sm transition-all group-hover:shadow-md group-hover:from-pk-green-500 group-hover:to-pk-green-600">
            PL
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-pk-green-900 transition-colors group-hover:text-pk-green-700 dark:text-pk-green-100 dark:group-hover:text-pk-green-300">
              Pakistan Legal Search
            </span>
            <span className="hidden sm:block text-[10px] font-medium uppercase tracking-widest text-pk-gold-600">
              Engine
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex md:items-center md:gap-6">
            {/* Search Dropdown */}
            <div className="relative"
              onMouseEnter={() => setSearchDropdownOpen(true)}
              onMouseLeave={() => setSearchDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 transition-colors hover:text-pk-green-700 dark:text-pk-green-300 dark:hover:text-pk-gold-400"
              >
                Search
                <svg className={`h-3.5 w-3.5 transition-transform ${searchDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {searchDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-lg dark:border-pk-green-700 dark:bg-pk-green-950">
                  {SEARCH_ENGINES.map((engine) => (
                    <Link key={engine.href} href={engine.href}
                      className="block px-4 py-2 transition-colors hover:bg-pk-green-50 dark:hover:bg-pk-green-900/50">
                      <span className="block text-sm font-medium text-zinc-800 dark:text-pk-green-100">{engine.label}</span>
                      <span className="block text-[11px] text-zinc-400 dark:text-pk-green-500">{engine.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/tools"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-pk-green-700 dark:text-pk-green-300 dark:hover:text-pk-gold-400"
            >
              Legal Tools
            </Link>
            <Link
              href="/sources"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-pk-green-700 dark:text-pk-green-300 dark:hover:text-pk-gold-400"
            >
              Sources
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-pk-green-700 dark:text-pk-green-300 dark:hover:text-pk-gold-400"
            >
              About
            </Link>
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 transition-colors hover:border-pk-green-200 hover:bg-pk-green-50 dark:border-pk-green-700 dark:hover:border-pk-gold-600 dark:hover:bg-pk-green-900"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4 text-pk-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 md:hidden hover:border-pk-green-200 hover:bg-pk-green-50 transition-colors dark:border-pk-green-700 dark:hover:border-pk-gold-600 dark:hover:bg-pk-green-900"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5 text-zinc-600 dark:text-pk-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 pb-4 pt-2 md:hidden dark:border-pk-green-800 dark:bg-pk-green-950">
          <nav className="flex flex-col gap-1">
            <div className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-pk-green-500">
              Search Engines
            </div>
            {SEARCH_ENGINES.map((engine) => (
              <Link key={engine.href} href={engine.href}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-pk-green-50 hover:text-pk-green-700 transition-colors dark:text-pk-green-200 dark:hover:bg-pk-green-900 dark:hover:text-pk-gold-400"
                onClick={() => setMenuOpen(false)}
              >
                <span>{engine.label}</span>
                <span className="text-[10px] text-zinc-400 dark:text-pk-green-500">{engine.desc}</span>
              </Link>
            ))}
            <div className="my-1 border-t border-zinc-100 dark:border-pk-green-800" />
            <Link href="/tools" onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-pk-green-50 hover:text-pk-green-700 transition-colors dark:text-pk-green-200 dark:hover:bg-pk-green-900 dark:hover:text-pk-gold-400">
              Legal Tools
            </Link>
            <Link href="/sources" onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-pk-green-50 hover:text-pk-green-700 transition-colors dark:text-pk-green-200 dark:hover:bg-pk-green-900 dark:hover:text-pk-gold-400">
              Sources
            </Link>
            <Link href="#" onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-pk-green-50 hover:text-pk-green-700 transition-colors dark:text-pk-green-200 dark:hover:bg-pk-green-900 dark:hover:text-pk-gold-400">
              About
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
