"use client";

import { useEffect, useState, useCallback } from "react";

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, title, onClose }: PDFViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Fallback: if PDF doesn't load within 20s, show error state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) {
        setError(true);
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [loaded]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleIframeLoad = () => {
    setLoaded(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-5xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-pk-green-700 dark:bg-pk-green-950 max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 dark:border-pk-green-800">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-pk-green-100">
              {title || "PDF Viewer"}
            </h3>
            <p className="truncate text-xs text-zinc-500 dark:text-pk-green-400">
              {pdfUrl}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open in new tab
            </a>
            <a
              href={pdfUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-pk-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-pk-green-700 dark:text-pk-green-400 dark:hover:bg-pk-green-900 dark:hover:text-pk-green-200"
              aria-label="Close PDF viewer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="relative flex-1 overflow-hidden rounded-b-2xl bg-zinc-100 dark:bg-pk-green-900/50" style={{ minHeight: "60vh" }}>
          {/* Loading state */}
          {!loaded && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-pk-green-200 border-t-pk-green-600 dark:border-pk-green-800 dark:border-t-pk-green-400" />
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pk-gold-500 dark:bg-pk-gold-400" />
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-pk-green-400">
                Loading PDF...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <svg className="h-8 w-8 text-red-500 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-pk-green-100">
                Could not load PDF
              </h3>
              <p className="max-w-md text-center text-sm text-zinc-600 dark:text-pk-green-300">
                The PDF could not be loaded in the browser. You can open it in a new tab or download it directly.
              </p>
              <div className="flex gap-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300"
                >
                  Open in new tab
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-pk-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950"
                >
                  Download PDF
                </a>
              </div>
            </div>
          )}

          {/* PDF iframe */}
          <iframe
            src={pdfUrl}
            className={`h-full w-full border-0 transition-opacity duration-300 ${
              loaded && !error ? "opacity-100" : "opacity-0 absolute"
            }`}
            style={{ minHeight: "60vh" }}
            onLoad={handleIframeLoad}
            title={title || "PDF Viewer"}
            allow="fullscreen"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2.5 sm:px-6 dark:border-pk-green-800">
          <p className="text-xs text-zinc-400 dark:text-pk-green-500">
            Source: External PDF from official court website
          </p>
          <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-pk-green-500">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Close with ESC
          </div>
        </div>
      </div>
    </div>
  );
}
