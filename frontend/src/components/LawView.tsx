"use client";

import type { LawSection } from "@/types";

interface LawViewProps {
  law: LawSection;
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

export default function LawView({ law }: LawViewProps) {
  const downloadText = () => {
    const content = `${law.law_name} - Section ${law.section_number}\n\n${law.section_text}\n\n${"=".repeat(80)}\n\nRelated Sections: ${law.related_sections.join(", ")}\n${law.related_judgments.length > 0 ? `\nRelated Judgments: ${law.related_judgments.join(", ")}` : ""}`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${law.law_name.replace(/[^a-zA-Z0-9]/g, "_")}_Section_${law.section_number}.txt`;
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
            <span className="rounded bg-pk-green-100 px-2 py-0.5 text-xs font-medium text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300">
              Law Section
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-pk-green-900 dark:text-pk-green-100">{law.law_name}</h1>
          <p className="mt-1 text-lg font-medium text-pk-gold-600 dark:text-pk-gold-400">Section {law.section_number}</p>
        </div>

        <div className="px-6 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Section Text</h2>
          <div className="rounded-lg border border-pk-green-100 bg-pk-green-50/50 p-5 dark:border-pk-green-800 dark:bg-pk-green-900/30">
            <p className="leading-relaxed text-zinc-700 dark:text-pk-green-300/80">{law.section_text}</p>
          </div>
        </div>

        {law.related_sections.length > 0 && (
          <div className="border-t border-zinc-100 px-6 py-4 dark:border-pk-green-800">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
              Related Sections
            </h2>
            <div className="flex flex-wrap gap-2">
              {law.related_sections.map((s, i) => (
                <span key={i} className="rounded bg-pk-green-100 px-2.5 py-1 text-sm font-medium text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {law.related_judgments.length > 0 && (
          <div className="border-t border-zinc-100 px-6 py-4 dark:border-pk-green-800">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
              Related Judgments
            </h2>
            <div className="flex flex-wrap gap-2">
              {law.related_judgments.map((j, i) => (
                <span key={i} className="rounded bg-pk-gold-100 px-2.5 py-1 text-sm font-medium text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">
                  {j}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-pk-green-800 dark:bg-pk-green-900/30">
          {isValidUrl(law.source_url) && (
            <a
              href={law.source_url}
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
            href={`https://www.google.com/search?q=${encodeURIComponent(`${law.law_name} Section ${law.section_number} Pakistan law`)}`}
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
            onClick={() => {
              navigator.clipboard.writeText(`${law.law_name} - Section ${law.section_number}\n\n${law.section_text}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-pk-green-200 hover:text-pk-green-700 dark:border-pk-green-700 dark:bg-pk-green-900 dark:text-pk-green-300 dark:hover:border-pk-green-500 dark:hover:text-pk-green-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            Copy Text
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pk-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
