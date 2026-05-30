"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getJudgment, type Judgment } from "@/lib/api";
import JudgmentView from "@/components/JudgmentView";

export default function JudgmentPage() {
  const params = useParams();
  const id = params.id as string;
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getJudgment(id)
      .then((data) => {
        if (data) {
          setJudgment(data);
          // Update page title for SEO
          document.title = `${data.title} | LegalSearch Pakistan`;
        } else {
          setError("Judgment not found.");
        }
      })
      .catch(() => setError("Failed to load judgment."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-pk-green-800" />
          <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-pk-green-800" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 rounded bg-zinc-100 dark:bg-pk-green-800/50" style={{ width: `${100 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !judgment) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950">
          <p className="text-zinc-600 dark:text-pk-green-300">{error || "Judgment not found."}</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400 dark:hover:text-pk-green-300">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalCase",
            name: judgment.title,
            description: judgment.description,
            url: `https://legalsearch.pk/judgment/${id}`,
            datePublished: judgment.date,
            author: { "@type": "Organization", name: judgment.court },
            identifier: { "@type": "PropertyValue", propertyID: "citation", value: judgment.citation },
            jurisdiction: { "@type": "Country", name: "Pakistan" },
          }),
        }}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-pk-green-400">
          <Link href="/" className="hover:text-pk-green-700 dark:hover:text-pk-green-300">Home</Link>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-zinc-900 dark:text-pk-green-100">Judgment</span>
        </div>
        <JudgmentView judgment={judgment} />
      </div>
    </>
  );
}
