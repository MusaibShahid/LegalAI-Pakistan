"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface SourceLink {
  name: string;
  url: string;
  description: string;
  tags: string[];
  type: "court" | "legislation" | "research" | "tribunal" | "international";
  free: boolean;
}

interface SourceCategory {
  title: string;
  icon: string;
  color: string;
  description: string;
  links: SourceLink[];
}

const sourceData: SourceCategory[] = [
  {
    title: "Supreme Court & Constitutional",
    icon: "⚖️",
    color: "from-purple-600 to-purple-800",
    description: "Highest appellate court, constitutional matters, and Shariat Court",
    links: [
      { name: "Supreme Court of Pakistan", url: "https://www.supremecourt.gov.pk/judgement-search/", description: "SC judgments, orders & latest decisions", tags: ["supreme court", "judgments", "case law"], type: "court", free: true },
      { name: "SCP Latest Judgments Portal", url: "https://scp.gov.pk/LatestJudgments", description: "Most recent Supreme Court judgments with direct PDF downloads", tags: ["supreme court", "latest", "pdf"], type: "court", free: true },
      { name: "Constitution of Pakistan (Official)", url: "https://constitution.gov.pk/", description: "Official Constitution of the Islamic Republic of Pakistan (1973)", tags: ["constitution", "fundamental rights", "constitutional law"], type: "court", free: true },
      { name: "Constitution via Pakistani.org", url: "https://www.pakistani.org/pakistan/constitution/", description: "Alternative source for the full constitution text", tags: ["constitution", "reference"], type: "court", free: true },
      { name: "Federal Shariat Court", url: "https://www.federalshariatcourt.gov.pk/en/", description: "Shariat Court judgments, rulings & annual reports", tags: ["shariat", "islamic law", "judgments"], type: "court", free: true },
      { name: "Supreme Court Annual Reports", url: "https://www.supremecourt.gov.pk/annual-reports/", description: "Annual reports, statistics & performance data", tags: ["reports", "statistics"], type: "court", free: true },
    ],
  },
  {
    title: "High Courts",
    icon: "🏛️",
    color: "from-blue-600 to-blue-800",
    description: "All five provincial High Courts with searchable judgment databases",
    links: [
      { name: "Lahore High Court", url: "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting", description: "LHC reported judgments, case status & cause lists", tags: ["lahore", "punjab", "judgments", "cause list"], type: "court", free: true },
      { name: "Sindh High Court", url: "https://caselaw.shc.gov.pk/caselaw/public/home", description: "SHC caselaw portal - advanced judgment search", tags: ["sindh", "karachi", "judgments", "caselaw"], type: "court", free: true },
      { name: "Sindh High Court (Main)", url: "https://sindhhighcourt.gov.pk/", description: "SHC official website, cause lists & orders", tags: ["sindh", "karachi", "cause list"], type: "court", free: true },
      { name: "Islamabad High Court", url: "https://ihc.gov.pk/", description: "IHC judgments, cause lists, daily orders & roster", tags: ["islamabad", "capital", "judgments"], type: "court", free: true },
      { name: "Peshawar High Court", url: "https://www.peshawarhighcourt.gov.pk/", description: "PHC judgments, daily cause lists & case information", tags: ["peshawar", "kpk", "judgments"], type: "court", free: true },
      { name: "Balochistan High Court", url: "https://bhc.gov.pk/", description: "BHC judgments, case information & cause lists", tags: ["balochistan", "quetta", "judgments"], type: "court", free: true },
    ],
  },
  {
    title: "Statutes & Legislation",
    icon: "📜",
    color: "from-emerald-600 to-emerald-800",
    description: "Federal and provincial legislation, acts, ordinances, and codes",
    links: [
      { name: "Pakistan Code", url: "https://pakistancode.gov.pk/", description: "Complete federal statutes, acts, ordinances & president's orders", tags: ["federal", "statutes", "acts", "ordinances"], type: "legislation", free: true },
      { name: "Pakistan Code - Alphabetical Index", url: "https://pakistancode.gov.pk/english/LGu0xAD.php", description: "All federal laws listed alphabetically for quick access", tags: ["federal", "index", "laws"], type: "legislation", free: true },
      { name: "Punjab Laws", url: "https://punjablaws.gov.pk/", description: "Punjab provincial legislation, acts & ordinances", tags: ["punjab", "provincial", "acts"], type: "legislation", free: true },
      { name: "Sindh Laws", url: "https://sindhlaws.gov.pk/", description: "Sindh provincial acts, ordinances & regulations", tags: ["sindh", "provincial", "acts"], type: "legislation", free: true },
      { name: "Khyber Pakhtunkhwa Laws", url: "https://kpk.gov.pk/laws", description: "KPK provincial legislation & legal framework", tags: ["kpk", "provincial", "acts"], type: "legislation", free: true },
      { name: "Balochistan Laws", url: "https://balochistan.gov.pk/laws/", description: "Balochistan provincial legislation & ordinances", tags: ["balochistan", "provincial", "acts"], type: "legislation", free: true },
    ],
  },
  {
    title: "Legal Research Platforms",
    icon: "🔍",
    color: "from-amber-600 to-amber-800",
    description: "Free and subscription-based legal databases for citation and case law research",
    links: [
      { name: "CommonLII Pakistan", url: "http://www.pakistan.commonlii.org/", description: "Free non-profit open-access legal database (Commonwealth LII)", tags: ["free", "open access", "commonwealth", "international"], type: "research", free: true },
      { name: "Pakistan Law Site", url: "https://www.pakistanlawsite.com/", description: "PLD/PLJ/MLD citation search with full text (subscription required)", tags: ["pld", "plj", "mld", "citations", "subscription"], type: "research", free: false },
      { name: "PLJ Law Site", url: "https://www.pljlawsite.com/citationsearch.asp", description: "Pakistan Law Journal - citation search and reference", tags: ["plj", "citations", "journal"], type: "research", free: true },
      { name: "Pakistani.org - Legislation", url: "https://www.pakistani.org/pakistan/legislation/", description: "Consolidated archive of Pakistani legislation (unofficial)", tags: ["free", "legislation", "archive"], type: "research", free: true },
      { name: "NYU Globalex - Pakistan Guide", url: "https://www.nyulawglobal.org/globalex/pakistan.html", description: "Authoritative NYU Law guide to navigating Pakistani legal research", tags: ["guide", "research", "international"], type: "research", free: true },
      { name: "Federal Judicial Academy Journal", url: "https://www.fja.gov.pk/", description: "FJA law journal & legal publications available as free PDFs", tags: ["journal", "publications", "pdfs", "free"], type: "research", free: true },
      { name: "Punjab Judicial Academy Library", url: "https://pja.gov.pk/lib-more", description: "PJA library resources, legal journals & research materials", tags: ["library", "journals", "research"], type: "research", free: true },
    ],
  },
  {
    title: "Specialized Tribunals & Bodies",
    icon: "📋",
    color: "from-rose-600 to-rose-800",
    description: "Regulatory bodies, tribunals, commissions and specialized legal forums",
    links: [
      { name: "Pakistan Information Commission", url: "https://rti.gov.pk/", description: "RTI appeals, information commission orders & right to information", tags: ["rti", "information", "transparency"], type: "tribunal", free: true },
      { name: "Election Commission of Pakistan", url: "https://www.ecp.gov.pk/", description: "Election laws, orders, tribunal decisions & delimitation", tags: ["election", "tribunal", "laws"], type: "tribunal", free: true },
      { name: "SECP - Securities & Exchange Commission", url: "https://www.secp.gov.pk/", description: "Corporate laws, company regulations, securities & compliance", tags: ["corporate", "securities", "company law"], type: "tribunal", free: true },
      { name: "NAB - National Accountability Bureau", url: "https://nab.gov.pk/", description: "Accountability laws, ordinances & NAB rules", tags: ["accountability", "corruption", "laws"], type: "tribunal", free: true },
      { name: "Federal Ombudsman (Wafaqi Mohtasib)", url: "https://www.mohtasib.gov.pk/", description: "Ombudsman orders, complaints & administrative justice", tags: ["ombudsman", "administrative", "complaints"], type: "tribunal", free: true },
      { name: "Pakistan Bar Council", url: "https://pakistanbarcouncil.org/", description: "Bar rules, legal ethics, professional conduct & lawyer regulations", tags: ["bar", "ethics", "legal profession"], type: "tribunal", free: true },
    ],
  },
  {
    title: "International & Comparative",
    icon: "🌐",
    color: "from-teal-600 to-teal-800",
    description: "International legal resources, human rights databases and comparative law",
    links: [
      { name: "AsianLII", url: "https://www.asianlii.org/", description: "Asian legal information institute - free Asian case law database", tags: ["asia", "international", "free", "case law"], type: "international", free: true },
      { name: "UNHCR Refworld - Pakistan", url: "https://www.refworld.org/country/PAK/", description: "Pakistan case law & legal references on refugee and asylum", tags: ["refugee", "asylum", "human rights", "un"], type: "international", free: true },
      { name: "SAFEM (South Asia Free Media)", url: "https://www.safem.org.pk/", description: "Media law resources, advocacy & legal research for South Asia", tags: ["media", "press freedom", "south asia"], type: "international", free: true },
      { name: "ICJ - Pakistan", url: "https://www.icj.org/country/pakistan/", description: "International Commission of Jurists - Pakistan rule of law", tags: ["icj", "rule of law", "international"], type: "international", free: true },
      { name: "UNODC - Pakistan", url: "https://www.unodc.org/pakistan/", description: "UN Office on Drugs & Crime - legal frameworks in Pakistan", tags: ["unodc", "crime", "drugs", "international"], type: "international", free: true },
      { name: "World Law Guide - Pakistan", url: "https://www.lexadin.nl/wlg/courts/nofr/oeur/lxctpak.htm", description: "Comprehensive directory of Pakistani courts & legal institutions", tags: ["directory", "courts", "reference"], type: "international", free: true },
    ],
  },
];

const typeFilters = [
  { id: "all", label: "All Sources", icon: "📂" },
  { id: "court", label: "Courts", icon: "🏛️" },
  { id: "legislation", label: "Legislation", icon: "📜" },
  { id: "research", label: "Research", icon: "🔍" },
  { id: "tribunal", label: "Tribunals", icon: "📋" },
  { id: "international", label: "International", icon: "🌐" },
] as const;

export default function SourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return sourceData
      .map((category) => ({
        ...category,
        links: category.links.filter((link) => {
          // Type filter
          if (activeType !== "all" && link.type !== activeType) return false;

          // Free only filter
          if (showFreeOnly && !link.free) return false;

          // Search query filter
          if (query) {
            return (
              link.name.toLowerCase().includes(query) ||
              link.description.toLowerCase().includes(query) ||
              link.tags.some((t) => t.includes(query))
            );
          }

          return true;
        }),
      }))
      .filter((category) => category.links.length > 0);
  }, [searchQuery, activeType, showFreeOnly]);

  const totalSources = sourceData.reduce((sum, c) => sum + c.links.length, 0);
  const visibleSources = filteredData.reduce((sum, c) => sum + c.links.length, 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-8 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pk-green-50 to-pk-gold-50 dark:from-pk-green-900/50 dark:to-pk-gold-900/30">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-pk-green-100">
                  Free Legal Data Sources
                </h1>
                <p className="text-sm text-zinc-500 dark:text-pk-green-400">
                  {totalSources} authentic Pakistani legal resources &mdash; all categorized &amp; searchable
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-4 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-900/40">
        <div className="mx-auto max-w-7xl">
          {/* Search */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-pk-green-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources by name, description, or tags..."
              className="h-10 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-pk-green-500 focus:ring-2 focus:ring-pk-green-500/20 dark:border-pk-green-700 dark:bg-pk-green-950 dark:text-pk-green-100 dark:placeholder-pk-green-600 dark:focus:border-pk-green-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-pk-green-500 dark:hover:text-pk-green-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveType(filter.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeType === filter.id
                    ? "border-pk-green-500 bg-pk-green-50 text-pk-green-800 shadow-sm dark:border-pk-green-400 dark:bg-pk-green-900 dark:text-pk-green-200"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-pk-green-700 dark:bg-pk-green-950 dark:text-pk-green-300 dark:hover:border-pk-green-600 dark:hover:bg-pk-green-900"
                }`}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-pk-green-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFreeOnly}
                  onChange={(e) => setShowFreeOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-pk-green-600 focus:ring-pk-green-500 dark:border-pk-green-700 dark:bg-pk-green-900"
                />
                Free only
              </label>

              {searchQuery || activeType !== "all" || showFreeOnly ? (
                <span className="text-xs text-zinc-400 dark:text-pk-green-500">
                  {visibleSources} of {totalSources} sources
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-pk-green-900/50">
                <svg className="h-8 w-8 text-zinc-400 dark:text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">No sources match your filters</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveType("all"); setShowFreeOnly(false); }}
                className="mt-4 rounded-lg bg-pk-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${activeType === "all" && !searchQuery ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
              {filteredData.map((category) => {
                const isExpanded = expandedCategory === category.title || searchQuery.length > 0;
                return (
                <div
                  key={category.title}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-pk-green-800 dark:bg-pk-green-950"
                >
                  {/* Category header */}
                  <div className={`bg-gradient-to-r ${category.color} px-5 py-4`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{category.title}</h3>
                        <p className="text-xs text-white/80">{category.description}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                      {category.links.length} source{category.links.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="px-5 py-3">
                    {(!isExpanded && category.links.length > 4) ? (
                      <>
                        {category.links.slice(0, 4).map((link) => (
                          <SourceListItem key={link.name} link={link} searchQuery={searchQuery} />
                        ))}
                        <button
                          onClick={() => setExpandedCategory(category.title)}
                          className="mt-2 w-full rounded-lg border border-dashed border-zinc-200 py-2 text-center text-xs font-medium text-zinc-500 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:text-pk-green-400 dark:hover:border-pk-green-500 dark:hover:text-pk-green-300"
                        >
                          Show all {category.links.length} sources &darr;
                        </button>
                      </>
                    ) : (
                      <>
                        {category.links.map((link) => (
                          <SourceListItem key={link.name} link={link} searchQuery={searchQuery} />
                        ))}
                        {category.links.length > 4 && (
                          <button
                            onClick={() => setExpandedCategory(null)}
                            className="mt-2 w-full rounded-lg border border-dashed border-zinc-200 py-2 text-center text-xs font-medium text-zinc-500 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:text-pk-green-400 dark:hover:border-pk-green-500 dark:hover:text-pk-green-300"
                          >
                            Show less &uarr;
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}

          {/* Bottom info */}
          {filteredData.length > 0 && (
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2 text-xs text-zinc-500 shadow-sm dark:border-pk-green-700 dark:bg-pk-green-950 dark:text-pk-green-400">
                <span className="flex h-2 w-2 rounded-full bg-pk-green-500" />
                Showing {visibleSources} sources across {filteredData.length} categories
                <span className="mx-1 text-zinc-300 dark:text-pk-green-700">|</span>
                <span className="text-pk-gold-600 dark:text-pk-gold-400">
                  {sourceData.reduce((sum, c) => sum + c.links.filter((l) => l.free).length, 0)} free
                </span>
                <span className="mx-1 text-zinc-300 dark:text-pk-green-700">·</span>
                <span className="text-zinc-400 dark:text-pk-green-500">
                  {sourceData.reduce((sum, c) => sum + c.links.filter((l) => !l.free).length, 0)} subscription
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceListItem({ link, searchQuery }: { link: SourceLink; searchQuery: string }) {
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const query = searchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-pk-gold-200 px-0.5 text-pk-gold-900 dark:bg-pk-gold-800 dark:text-pk-gold-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-pk-green-50 dark:hover:bg-pk-green-900/50"
    >
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover/link:text-pk-green-600 dark:text-pk-green-500 dark:group-hover/link:text-pk-gold-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-800 transition-colors group-hover/link:text-pk-green-700 dark:text-pk-green-200 dark:group-hover/link:text-pk-gold-300">
            {highlightText(link.name)}
          </span>
          {link.free ? (
            <span className="shrink-0 rounded bg-pk-green-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300">
              Free
            </span>
          ) : (
            <span className="shrink-0 rounded bg-pk-gold-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-pk-gold-700 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">
              Sub
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-pk-green-400">
          {highlightText(link.description)}
        </p>
        {link.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {link.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-pk-green-900 dark:text-pk-green-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
