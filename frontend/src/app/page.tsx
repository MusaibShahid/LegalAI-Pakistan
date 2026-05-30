"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { getLatestJudgments, type LatestJudgment } from "@/lib/api";

const quickLinks = [
  // Supreme Court citations
  { label: "2006 SCMR 109", query: "2006 SCMR 109", type: "Citation" },
  { label: "PLD 2023 SC 1", query: "PLD 2023 SC 1", type: "Citation" },
  { label: "2025 SCMR 1", query: "2025 SCMR 1", type: "Citation" },
  // High Court citations
  { label: "2024 PCrLJ 156", query: "2024 PCrLJ 156", type: "Citation" },
  { label: "YLR 2022 2345", query: "YLR 2022 2345", type: "Citation" },
  { label: "2023 CLC 456", query: "2023 CLC 456", type: "Citation" },
  { label: "2024 MLD 789", query: "2024 MLD 789", type: "Citation" },
  // Sections
  { label: "489-F PPC", query: "489-F PPC", type: "Section" },
  { label: "Article 199", query: "Article 199", type: "Section" },
  { label: "Section 21 PECA", query: "Section 21 PECA", type: "Section" },
  // Keywords
  { label: "Bail judgments", query: "Supreme Court bail", type: "Keyword" },
  { label: "Cybercrime", query: "Cybercrime evidence PECA", type: "Keyword" },
  { label: "Cheque dishonour", query: "Cheque dishonour 489-F", type: "Keyword" },
];

const sourceCategories = [
  {
    title: "Supreme Court & Constitutional",
    icon: "⚖️",
    links: [
      { name: "Supreme Court of Pakistan", url: "https://www.supremecourt.gov.pk/judgement-search/", description: "SC judgments, orders & latest decisions" },
      { name: "SCP Latest Judgments", url: "https://scp.gov.pk/LatestJudgments", description: "Most recent Supreme Court judgments with PDFs" },
      { name: "Constitution of Pakistan", url: "https://constitution.gov.pk/", description: "Official Constitution of Pakistan (1973)" },
      { name: "Federal Shariat Court", url: "https://www.federalshariatcourt.gov.pk/en/", description: "Shariat Court judgments & rulings" },
      { name: "Supreme Court Annual Reports", url: "https://www.supremecourt.gov.pk/annual-reports/", description: "SC annual reports & statistics" },
    ],
  },
  {
    title: "High Courts",
    icon: "🏛️",
    links: [
      { name: "Lahore High Court", url: "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting", description: "LHC reported judgments & case status" },
      { name: "Sindh High Court", url: "https://caselaw.shc.gov.pk/caselaw/public/home", description: "SHC caselaw portal - search judgments" },
      { name: "Islamabad High Court", url: "https://ihc.gov.pk/", description: "IHC judgments, cause lists & orders" },
      { name: "Peshawar High Court", url: "https://www.peshawarhighcourt.gov.pk/", description: "PHC judgments & daily cause lists" },
      { name: "Balochistan High Court", url: "https://bhc.gov.pk/", description: "BHC judgments & case information" },
    ],
  },
  {
    title: "Statutes & Legislation",
    icon: "📜",
    links: [
      { name: "Pakistan Code", url: "https://pakistancode.gov.pk/", description: "Complete federal statutes, acts & ordinances" },
      { name: "Punjab Laws", url: "https://punjablaws.gov.pk/", description: "Punjab provincial legislation" },
      { name: "Sindh Laws", url: "https://sindhlaws.gov.pk/", description: "Sindh provincial acts & ordinances" },
      { name: "KPK Laws", url: "https://kpk.gov.pk/laws", description: "Khyber Pakhtunkhwa legislation" },
      { name: "Balochistan Laws", url: "https://balochistan.gov.pk/laws/", description: "Balochistan provincial laws" },
    ],
  },
  {
    title: "Legal Research Platforms",
    icon: "🔍",
    links: [
      { name: "CommonLII Pakistan", url: "http://www.pakistan.commonlii.org/", description: "Free open-access legal database (non-profit)" },
      { name: "Pakistan Law Site", url: "https://www.pakistanlawsite.com/", description: "PLD/PLJ/MLD citation search (subscription)" },
      { name: "PLJ Law Site", url: "https://www.pljlawsite.com/citationsearch.asp", description: "Pakistan Law Journal citation search" },
      { name: "Pakistani.org Law", url: "https://www.pakistani.org/pakistan/legislation/", description: "Consolidated legislation archive" },
      { name: "Globalex - Pakistan", url: "https://www.nyulawglobal.org/globalex/pakistan.html", description: "NYU Law guide to Pakistani legal research" },
    ],
  },
  {
    title: "Specialized Tribunals & Bodies",
    icon: "📋",
    links: [
      { name: "Pakistan Information Commission", url: "https://rti.gov.pk/", description: "RTI appeals & information commission orders" },
      { name: "Federal Judicial Academy", url: "https://www.fja.gov.pk/", description: "FJA law journal & publications (free PDFs)" },
      { name: "Punjab Judicial Academy", url: "https://pja.gov.pk/lib-more", description: "PJA library resources & legal journals" },
      { name: "Election Commission of Pakistan", url: "https://www.ecp.gov.pk/", description: "Election laws, orders & tribunal decisions" },
      { name: "SECP", url: "https://www.secp.gov.pk/", description: "Corporate laws, regulations & company law" },
    ],
  },
  {
    title: "International & Comparative",
    icon: "🌐",
    links: [
      { name: "SAFEM (South Asia Free Media)", url: "https://www.safem.org.pk/", description: "Media law resources & legal research" },
      { name: "AsianLII", url: "https://www.asianlii.org/", description: "Asian legal information institute" },
      { name: "UNHCR Refworld - Pakistan", url: "https://www.refworld.org/country/PAK/", description: "Pakistan case law on refugee & asylum" },
      { name: "ICJ - Pakistan", url: "https://www.icj.org/country/pakistan/", description: "International Commission of Jurists" },
      { name: "Pakistan Bar Council", url: "https://pakistanbarcouncil.org/", description: "Bar rules, ethics & professional conduct" },
    ],
  },
];

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    ),
    color: "pk-green",
    title: "Citation Search",
    description: "Look up judgments by exact citation — SCMR, PLD, YLR, and more.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: "pk-gold",
    title: "Section Search",
    description: "Find specific legal sections across PPC, CrPC, PECA, and other statutes.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "pk-green",
    title: "Keyword Search",
    description: "Search across full-text judgments using natural language or legal terminology.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    color: "pk-gold",
    title: "Court Filtering",
    description: "Filter results by court, judge, year, case type, and jurisdiction.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "pk-green",
    title: "Fast Results",
    description: "Optimized search with cached results for sub-3-second response times.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "pk-gold",
    title: "Verified Sources",
    description: "All results sourced directly from official Pakistan legal portals.",
  },
];

const courtFilters = [
  "Supreme Court of Pakistan",
  "Lahore High Court",
  "Sindh High Court",
];

export default function Home() {
  const [latestJudgments, setLatestJudgments] = useState<LatestJudgment[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [activeCourt, setActiveCourt] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLoadingLatest(true);
    getLatestJudgments(10, activeCourt)
      .then(setLatestJudgments)
      .catch(() => setLatestJudgments([]))
      .finally(() => setLoadingLatest(false));
  }, [activeCourt]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pk-green-50 via-white to-white dark:from-pk-green-950 dark:via-pk-green-950 dark:to-pk-green-950" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[600px] opacity-60" style={{ background: 'radial-gradient(circle at center, rgba(0, 102, 51, 0.15) 0%, transparent 60%)' }} />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-pk-green-200 bg-pk-green-50 px-4 py-1.5 text-sm text-pk-green-800 shadow-sm dark:border-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-200">
              <span className="flex h-2 w-2 rounded-full bg-pk-green-500">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-pk-green-400 opacity-75" />
              </span>
              <span className="font-medium">Phase 1</span>
              <span className="text-pk-green-600 dark:text-pk-green-400">—</span>
              <span>Now indexing Supreme Court &amp; High Courts</span>
            </div>
          </div>

          <h1 className="text-center text-4xl font-bold leading-tight tracking-tight text-pk-green-900 sm:text-5xl lg:text-6xl dark:text-pk-green-100">
            Pakistan Legal Research,
            <br />
            <span className="bg-gradient-to-r from-pk-green-700 to-pk-green-500 bg-clip-text text-transparent dark:from-pk-green-300 dark:to-pk-green-400">
              Unified.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-zinc-600 dark:text-pk-green-300">
            Search across Supreme Court judgments, High Court decisions, statutes, and legal citations — all from one place.
          </p>

          <div className="mx-auto mt-8 w-full max-w-2xl">
            <SearchBar large showYearFilter />
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-xs font-medium text-zinc-400 dark:text-pk-green-400">Quick searches:</span>
              {quickLinks.map((link) => (
                <Link
                  key={link.query}
                  href={`/search?q=${encodeURIComponent(link.query)}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-all hover:border-pk-gold-300 hover:text-pk-gold-800 hover:shadow dark:border-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-200 dark:hover:border-pk-gold-600 dark:hover:text-pk-gold-300"
                >
                  <span className="rounded bg-pk-green-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-pk-green-700 group-hover:bg-pk-gold-100 group-hover:text-pk-gold-700 dark:bg-pk-green-800 dark:text-pk-green-200 dark:group-hover:bg-pk-gold-900/50 dark:group-hover:text-pk-gold-300">
                    {link.type}
                  </span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-400 dark:text-pk-green-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Official sources only
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-pk-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sub-3 second results
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Smart filtering
            </span>
          </div>
        </div>
      </section>

      {/* Latest Case Law Section */}
      <section className="border-t border-zinc-100 bg-white px-4 py-16 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-pk-green-600 dark:text-pk-green-400">
                Latest Case Law
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pk-green-900 dark:text-pk-green-100">
                Recent Judgments & Citations
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-300">
                Most recently added judgments from Pakistani courts
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCourt(undefined)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  !activeCourt
                    ? "bg-pk-green-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-pk-green-800 dark:text-pk-green-300 dark:hover:bg-pk-green-700"
                }`}
              >
                All Courts
              </button>
              {courtFilters.map((court) => (
                <button
                  key={court}
                  onClick={() => setActiveCourt(court)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCourt === court
                      ? "bg-pk-green-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-pk-green-800 dark:text-pk-green-300 dark:hover:bg-pk-green-700"
                  }`}
                >
                  {court.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {loadingLatest ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 dark:border-pk-green-800 dark:bg-pk-green-900/50">
                  <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-pk-green-800" />
                  <div className="mt-2 h-5 w-3/4 rounded bg-zinc-200 dark:bg-pk-green-800" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-zinc-200 dark:bg-pk-green-800" />
                  <div className="mt-3 h-3 w-full rounded bg-zinc-100 dark:bg-pk-green-800/50" />
                </div>
              ))}
            </div>
          ) : latestJudgments.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center dark:border-pk-green-800 dark:bg-pk-green-900/30">
              <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-pk-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-3 text-sm text-zinc-500 dark:text-pk-green-400">No judgments available yet. Run the crawler to populate data.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestJudgments.map((j) => (
                <Link
                  key={j.id}
                  href={`/judgment/${j.id}`}
                  className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-pk-green-200 hover:shadow-lg hover:shadow-pk-green-100/50 dark:border-pk-green-800 dark:bg-pk-green-900/50 dark:hover:border-pk-green-600 dark:hover:shadow-pk-green-900/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-pk-gold-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">
                      {j.court?.split(" ")[0] || "Court"}
                    </span>
                    {j.date && (
                      <span className="text-[10px] text-zinc-400 dark:text-pk-green-500">{j.date}</span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-pk-green-700 dark:text-pk-green-100 dark:group-hover:text-pk-green-300 line-clamp-2">
                    {j.title}
                  </h3>
                  {j.citation && (
                    <p className="mt-1 text-xs font-medium text-pk-green-700 dark:text-pk-green-400">
                      {j.citation}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 line-clamp-2 dark:text-pk-green-300/70">
                    {j.description || "No description available."}
                  </p>
                  {j.judge && (
                    <p className="mt-2 text-[10px] text-zinc-400 dark:text-pk-green-500">
                      Judge: {j.judge}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {latestJudgments.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                href="/search?q=*&sort=date"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400"
              >
                View all judgments
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-zinc-100 bg-white px-4 py-20 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-pk-green-600 dark:text-pk-green-400">
              Search Capabilities
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-pk-green-900 sm:text-4xl dark:text-pk-green-100">
              Everything you need for legal research
            </p>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500 dark:text-pk-green-300">
              Purpose-built for Pakistan&apos;s legal system — from Supreme Court precedent to statutory provisions.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-pk-green-200 hover:shadow-lg hover:shadow-pk-green-100/50 dark:border-pk-green-800 dark:bg-pk-green-900/50 dark:hover:border-pk-green-600 dark:hover:shadow-pk-green-900/50"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    feature.color === "pk-green"
                      ? "bg-pk-green-100 text-pk-green-700 group-hover:bg-pk-green-600 group-hover:text-white dark:bg-pk-green-800 dark:text-pk-green-200 dark:group-hover:bg-pk-green-600 dark:group-hover:text-white"
                      : "bg-pk-gold-100 text-pk-gold-700 group-hover:bg-pk-gold-500 group-hover:text-white dark:bg-pk-gold-900/50 dark:text-pk-gold-200 dark:group-hover:bg-pk-gold-600 dark:group-hover:text-white"
                  } transition-all duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900 group-hover:text-pk-green-800 dark:text-pk-green-100 dark:group-hover:text-pk-green-300">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-pk-green-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources Section */}
      <div className="h-px bg-gradient-to-r from-transparent via-pk-gold-300 to-transparent" />
      <section className="bg-pk-green-900 px-4 py-16 dark:bg-black/40">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-pk-gold-400">
              Free Legal Data Sources
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl dark:text-pk-green-100">
              Authentic &amp; Free Pakistani Legal Resources
            </p>
            <p className="mx-auto mt-3 max-w-xl text-pk-green-200 dark:text-pk-green-300">
              All results sourced from official government portals &amp; free public legal repositories.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sourceCategories.map((category) => (
              <div
                key={category.title}
                className="group relative overflow-hidden rounded-xl border border-pk-green-700 bg-pk-green-800/50 p-6 transition-all hover:border-pk-gold-600 hover:bg-pk-green-800 dark:border-pk-green-700 dark:bg-pk-green-900/30 dark:hover:border-pk-gold-500 dark:hover:bg-pk-green-800/30"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pk-gold-500/5 transition-all group-hover:bg-pk-gold-500/10" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <h3 className="text-base font-semibold text-white group-hover:text-pk-gold-300 dark:group-hover:text-pk-gold-400">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.links.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-pk-green-200 transition-colors hover:bg-pk-green-700/50 hover:text-pk-gold-200 dark:text-pk-green-300 dark:hover:text-pk-gold-300"
                        >
                          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pk-green-400 group-hover:text-pk-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          <div>
                            <span className="font-medium">{link.name}</span>
                            <p className="mt-0.5 text-xs text-pk-green-400 dark:text-pk-green-500">{link.description}</p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom footer note */}
      <section className="border-t border-pk-green-800 bg-pk-green-900 px-4 py-4 dark:bg-black/40 dark:border-pk-green-800/50">
        <p className="text-center text-xs text-pk-green-300 dark:text-pk-green-400">
          PLSE is a research tool. Always verify legal references against official published sources.
        </p>
      </section>
    </div>
  );
}
