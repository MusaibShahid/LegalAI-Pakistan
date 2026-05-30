"use client";

import { useState } from "react";
import type { Judgment } from "@/types";
import PDFViewer from "./PDFViewer";

interface JudgmentViewProps {
  judgment: Judgment;
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

export default function JudgmentView({ judgment }: JudgmentViewProps) {
  const [showPdf, setShowPdf] = useState(false);
  const hasValidPdf = isValidUrl(judgment.pdf_url);

  const downloadText = () => {
    const content = `${judgment.title}\nCitation: ${judgment.citation}\nCourt: ${judgment.court}\nDate: ${judgment.date}\n${judgment.case_number ? `Case Number: ${judgment.case_number}\n` : ""}${judgment.judge ? `Judge: ${judgment.judge}\n` : ""}\n${"=".repeat(80)}\n\n${judgment.full_text}`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${judgment.citation.replace(/[^a-zA-Z0-9]/g, "_") || judgment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950 dark:shadow-pk-green-950/50">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

        <div className="border-b border-zinc-100 px-6 py-5 dark:border-pk-green-800">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-pk-gold-100 px-2 py-0.5 text-xs font-medium text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">
              Judgment
            </span>
            <span className="text-sm font-medium text-pk-green-700 dark:text-pk-green-400">{judgment.citation}</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-pk-green-900 dark:text-pk-green-100">{judgment.title}</h1>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-zinc-100 bg-pk-green-50/30 px-6 py-4 sm:grid-cols-3 lg:grid-cols-4 dark:border-pk-green-800 dark:bg-pk-green-900/40">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Court</dt>
            <dd className="mt-0.5 text-sm font-medium text-pk-green-800 dark:text-pk-green-300">{judgment.court}</dd>
          </div>
          {judgment.bench && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Bench</dt>
              <dd className="mt-0.5 text-sm font-medium text-pk-green-800 dark:text-pk-green-300">{judgment.bench}</dd>
            </div>
          )}
          {judgment.judge && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Judge</dt>
              <dd className="mt-0.5 text-sm font-medium text-pk-green-800 dark:text-pk-green-300">{judgment.judge}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Date</dt>
            <dd className="mt-0.5 text-sm font-medium text-pk-green-800 dark:text-pk-green-300">{judgment.date}</dd>
          </div>
          {judgment.case_number && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Case Number</dt>
              <dd className="mt-0.5 text-sm font-medium text-pk-green-800 dark:text-pk-green-300">{judgment.case_number}</dd>
            </div>
          )}
          {judgment.sections.length > 0 && (
            <div className="col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Sections Referenced</dt>
              <dd className="mt-0.5 flex flex-wrap gap-1.5">
                {judgment.sections.map((s, i) => (
                  <span key={i} className="rounded bg-pk-green-100 px-2 py-0.5 text-xs font-medium text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Full Text</h2>
          <div className="prose prose-sm max-w-none prose-headings:text-zinc-900 prose-p:text-zinc-700 dark:prose-headings:text-pk-green-100 dark:prose-p:text-pk-green-300/80">
            {judgment.full_text.split("\n").map((para, i) => (
              <p key={i} className="mb-3 leading-relaxed text-zinc-700 dark:text-pk-green-300/80">
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-pk-green-800 dark:bg-pk-green-900/30">
          {isValidUrl(judgment.source_url) && (
            <a
              href={judgment.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500 dark:hover:text-pk-green-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Source
            </a>
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${judgment.citation || judgment.title} ${judgment.court} Pakistan judgment`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500 dark:hover:text-pk-green-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Verify Online
          </a>
          <button
            onClick={downloadText}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500 dark:hover:text-pk-green-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download TXT
          </button>
          {/* View PDF Button - opens inline viewer */}
          {hasValidPdf && (
            <button
              onClick={() => setShowPdf(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pk-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-pk-green-700 shadow-sm hover:shadow-md dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              View PDF
            </button>
          )}
          {/* Download PDF Button */}
          {hasValidPdf && (
            <a
              href={judgment.pdf_url}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-pk-green-300 bg-pk-green-50 px-4 py-2 text-sm font-medium text-pk-green-700 transition-all hover:bg-pk-green-100 hover:border-pk-green-400 dark:border-pk-green-600 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:bg-pk-green-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </a>
          )}
          {/* Find PDF link - fallback for online verification of PDF */}
          {!hasValidPdf && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${judgment.citation || judgment.title} ${judgment.court} PDF`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Find PDF Online
            </a>
          )}
        </div>
      </div>

      {/* Inline PDF Viewer Modal */}
      {showPdf && hasValidPdf && (
        <PDFViewer
          pdfUrl={judgment.pdf_url!}
          title={`${judgment.citation || judgment.title} - PDF`}
          onClose={() => setShowPdf(false)}
        />
      )}
    </div>
  );
}
