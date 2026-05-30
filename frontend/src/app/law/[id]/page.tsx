"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LawView from "@/components/LawView";
import { getLawSection } from "@/lib/api";
import type { LawSection } from "@/types";

export default function LawPage() {
  const { id } = useParams<{ id: string }>();
  const [law, setLaw] = useState<LawSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getLawSection(id)
      .then(setLaw)
      .catch(() => setError("Failed to load law section. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="relative h-10 w-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pk-green-100 border-t-pk-green-600 dark:border-pk-green-800 dark:border-t-pk-green-400" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pk-gold-500 dark:bg-pk-gold-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/50">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg className="h-6 w-6 text-red-500 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!law) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="rounded-xl border border-pk-green-200 bg-white p-12 text-center dark:border-pk-green-800 dark:bg-pk-green-950">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pk-green-50 dark:bg-pk-green-900/50">
            <svg className="h-7 w-7 text-pk-green-400 dark:text-pk-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-pk-green-900 dark:text-pk-green-100">Law section not found</h2>
          <p className="mt-1 text-sm text-pk-green-600 dark:text-pk-green-400">The law section you&apos;re looking for could not be retrieved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <LawView law={law} />
    </div>
  );
}
