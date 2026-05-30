"use client";

import { useState } from "react";
import Link from "next/link";
import type { SearchResult } from "@/types";
import PDFViewer from "./PDFViewer";

interface ResultCardProps {
  result: SearchResult;
}

function isValidUrl(url?: string | null): boolean {
  if (!url || url.trim() === "" || url === "null" || url === "undefined") return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ResultCard({ result }: ResultCardProps) {
  const [showPdf, setShowPdf] = useState(false);
  const hasValidSource = isValidUrl(result.source_url);
  const hasValidPdf = isValidUrl(result.pdf_url);
  // Build a Google search fallback for verification
  const verifyUrl = `https://www.google.com/search?q=${encodeURIComponent(`${result.citation || result.title} ${result.court} Pakistan judgment`)}`;

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-pk-green-200 hover:shadow-md hover:shadow-pk-green-100/30 dark:border-pk-green-800 dark:bg-pk-green-950 dark:hover:border-pk-green-600 dark:hover:shadow-pk-green-950/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                result.type === "judgment"
                  ? "bg-pk-gold-100 text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                  : "bg-pk-green-100 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300"
              }`}
            >
              {result.type}
            </span>
            {result.citation && (
              <span className="text-xs font-medium text-pk-green-700 dark:text-pk-green-400">{result.citation}</span>
            )}
          </div>
          <Link
            href={result.type === "judgment" ? `/judgment/${result.id}` : `/law/${result.id}`}
            className="mt-1 block text-base font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-pk-green-700 dark:text-pk-green-100 dark:group-hover:text-pk-green-300"
          >
            {result.title}
          </Link>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 line-clamp-2 dark:text-pk-green-300/70">
            {result.description}
          </p>
          {/* Content snippet from document */}
          {result.content_snippet && (
            <div className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-pk-green-800/50 dark:bg-pk-green-900/20">
              <p className="text-xs leading-relaxed text-zinc-500 line-clamp-3 dark:text-pk-green-400/70">
                {result.content_snippet}
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-pk-green-400">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-pk-green-500 dark:text-pk-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              {result.court}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-pk-gold-500 dark:text-pk-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {result.date}
            </span>
            {result.sections.length > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-pk-green-500 dark:text-pk-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                {result.sections.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-pk-green-800">
        <Link
          href={result.type === "judgment" ? `/judgment/${result.id}` : `/law/${result.id}`}
          className="text-xs font-medium text-pk-green-600 transition-colors hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-gold-400"
        >
          Open {result.type === "judgment" ? "Judgment" : "Law"}
        </Link>
        {result.type === "judgment" && hasValidPdf && (
          <button
            onClick={() => setShowPdf(true)}
            className="inline-flex items-center gap-1 rounded bg-pk-green-600 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-pk-green-700 shadow-sm hover:shadow dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            View PDF
          </button>
        )}
        {hasValidPdf && result.type === "judgment" && (
          <a
            href={result.pdf_url}
            download
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-pk-green-400/70 dark:hover:text-pk-green-300"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </a>
        )}
        {hasValidSource && (
          <a
            href={result.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-pk-green-400/70 dark:hover:text-pk-green-300"
          >
            View Source &rarr;
          </a>
        )}
        {/* Always show a verification link */}
        <a
          href={verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:text-pk-green-400/50 dark:hover:text-pk-green-300"
        >
          Verify Online &rarr;
        </a>
      </div>

      {/* Inline PDF Viewer Modal */}
      {showPdf && hasValidPdf && (
        <PDFViewer
          pdfUrl={result.pdf_url!}
          title={`${result.citation || result.title} - PDF`}
          onClose={() => setShowPdf(false)}
        />
      )}
    </div>
  );
}
