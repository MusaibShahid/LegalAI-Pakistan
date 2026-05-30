"use client";

import type { SCPJudgment, SCPCitation } from "@/lib/api";

interface SCPCitationsViewProps {
  judgments: SCPJudgment[];
  citations: SCPCitation[];
  loading?: boolean;
}

export default function SCPCitationsView({ judgments, citations, loading }: SCPCitationsViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-zinc-200 bg-white p-4 dark:border-pk-green-800 dark:bg-pk-green-900/50">
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-pk-green-800" />
            <div className="mt-2 h-5 w-3/4 rounded bg-zinc-200 dark:bg-pk-green-800" />
            <div className="mt-2 h-3 w-1/2 rounded bg-zinc-200 dark:bg-pk-green-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Judgments Section */}
      {judgments.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
            Recent Judgments ({judgments.length})
          </h3>
          <div className="space-y-3">
            {judgments.map((judgment, index) => (
              <div
                key={judgment.case_number || index}
                className="rounded-lg border border-zinc-200 bg-white p-4 transition-all hover:border-pk-green-200 hover:shadow-md dark:border-pk-green-800 dark:bg-pk-green-900/50 dark:hover:border-pk-green-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-pk-gold-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300">
                        {judgment.sr_no}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-pk-green-400">
                        {judgment.case_number}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 dark:text-pk-green-100">
                      {judgment.case_title}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-600 line-clamp-2 dark:text-pk-green-300">
                      {judgment.case_subject}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-pk-green-400">
                      {judgment.author_judge && (
                        <span>Judge: {judgment.author_judge}</span>
                      )}
                      {judgment.judgment_date && (
                        <span>Date: {judgment.judgment_date}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {(judgment.sc_citation || judgment.citation) && (
                      <div className="rounded bg-pk-green-50 px-2 py-1 text-xs font-medium text-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-300">
                        {judgment.sc_citation || judgment.citation}
                      </div>
                    )}
                    {judgment.pdf_url && (
                      <a
                        href={judgment.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-pk-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-pk-green-700 dark:bg-pk-green-500 dark:hover:bg-pk-green-400"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citations Section */}
      {citations.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
            Recent Citations ({citations.length})
          </h3>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-pk-green-800">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-pk-green-800">
              <thead className="bg-zinc-50 dark:bg-pk-green-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Citation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Case Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Judge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-pk-green-800 dark:bg-pk-green-950">
                {citations.map((citation, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-pk-green-900/30">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded bg-pk-green-50 px-2 py-0.5 text-xs font-medium text-pk-green-700 dark:bg-pk-green-900/50 dark:text-pk-green-300">
                        {citation.sc_citation || citation.citation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-900 line-clamp-1 dark:text-pk-green-100">
                        {citation.case_title}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-pk-green-400">
                        {citation.case_number}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-pk-green-300">
                      {citation.judge}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-pk-green-400">
                      {citation.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {judgments.length === 0 && citations.length === 0 && !loading && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-pk-green-800 dark:bg-pk-green-900/30">
          <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-pk-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="mt-3 text-sm text-zinc-500 dark:text-pk-green-400">
            No SCP judgments available yet. Run the SCP crawler to populate data.
          </p>
          <p className="mt-2 text-xs text-zinc-400 dark:text-pk-green-500">
            Run: python crawler/playwright_crawler/scp_scraper.py
          </p>
        </div>
      )}
    </div>
  );
}
