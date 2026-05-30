"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getToolkit,
  getBailInfo,
  getLimitationPeriods,
  getCourtFees,
} from "@/lib/api";
import type {
  LegalToolkit,
  BailInfo,
  LimitationInfo,
  CourtFeeInfo,
  ProcedureCategory,
} from "@/types";

type Tab = "tools" | "bail" | "limitation" | "fees";

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("tools");
  const [toolkit, setToolkit] = useState<LegalToolkit | null>(null);
  const [bailInfo, setBailInfo] = useState<BailInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [tk, bi] = await Promise.all([
          getToolkit().catch(() => null),
          getBailInfo().catch(() => []),
        ]);
        if (tk) setToolkit(tk);
        if (bi.length > 0) setBailInfo(bi);
      } catch {
        setError("Could not load legal tools data. Make sure the backend server is running.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "tools", label: "All Tools", icon: "🔧" },
    { id: "limitation", label: "Limitation Periods", icon: "⏱️" },
    { id: "fees", label: "Court Fees", icon: "💰" },
    { id: "bail", label: "Bail Info", icon: "⚖️" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-1 bg-gradient-to-r from-pk-green-600 via-pk-gold-500 to-pk-green-600" />

      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8 dark:border-pk-green-800 dark:bg-pk-green-950">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pk-green-50 to-pk-gold-50 dark:from-pk-green-900/50 dark:to-pk-gold-900/30">
              <span className="text-2xl">🔧</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-pk-green-100">
                Free Legal Tools
              </h1>
              <p className="text-sm text-zinc-500 dark:text-pk-green-400">
                Practical resources for Pakistani legal practitioners and litigants
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-pk-green-500 bg-pk-green-50 text-pk-green-800 shadow-sm dark:border-pk-green-400 dark:bg-pk-green-900 dark:text-pk-green-200"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-pk-green-800 dark:bg-pk-green-950 dark:text-pk-green-300 dark:hover:border-pk-green-600 dark:hover:bg-pk-green-900"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-pk-green-100 border-t-pk-green-600 dark:border-pk-green-800 dark:border-t-pk-green-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-pk-gold-400/60 dark:bg-pk-gold-500/60" />
              </div>
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-500 dark:text-pk-green-400">
              Loading legal tools...
            </p>
          </div>
        )}

        {error && (
          <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200 dark:bg-red-800">
                <svg className="h-4 w-4 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Tab: All Tools Overview */}
            {activeTab === "tools" && toolkit && (
              <div className="space-y-8">
                {/* Quick Access Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <QuickAccessCard
                    icon="⏱️"
                    title="Limitation Periods"
                    description="Check limitation periods for various civil and criminal proceedings under the Limitation Act 1908"
                    count={toolkit.limitation_periods.length}
                    onClick={() => setActiveTab("limitation")}
                  />
                  <QuickAccessCard
                    icon="💰"
                    title="Court Fees"
                    description="Court fee information for different types of legal proceedings"
                    count={toolkit.court_fees.length}
                    onClick={() => setActiveTab("fees")}
                  />
                  <QuickAccessCard
                    icon="⚖️"
                    title="Bail Information"
                    description="Understand bail provisions under CrPC for different types of offenses"
                    count={bailInfo.length}
                    onClick={() => setActiveTab("bail")}
                  />
                  <QuickAccessCard
                    icon="📋"
                    title="Legal Procedures"
                    description="Step-by-step guides for common legal procedures in Pakistani courts"
                    count={toolkit.procedures.reduce((sum, c) => sum + c.procedures.length, 0)}
                    onClick={() => setSelectedProcedure(null)}
                  />
                </div>

                {/* Procedure Categories */}
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-pk-green-100">
                    Legal Procedure Guides
                  </h2>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {toolkit.procedures.map((category) => (
                      <div
                        key={category.id}
                        className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-xl">{category.icon === "scale" ? "⚖️" : category.icon === "file-text" ? "📄" : category.icon === "users" ? "👨‍👩‍👧‍👦" : "🏠"}</span>
                          <div>
                            <h3 className="font-semibold text-zinc-800 dark:text-pk-green-200">{category.name}</h3>
                            <p className="text-xs text-zinc-500 dark:text-pk-green-400">{category.description}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {category.procedures.map((proc) => (
                            <button
                              key={proc.id}
                              onClick={() => setSelectedProcedure(selectedProcedure === proc.id ? null : proc.id)}
                              className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                                selectedProcedure === proc.id
                                  ? "border-pk-green-300 bg-pk-green-50 dark:border-pk-green-600 dark:bg-pk-green-900"
                                  : "border-zinc-100 bg-zinc-50 hover:border-pk-green-200 hover:bg-pk-green-50/50 dark:border-pk-green-800 dark:bg-pk-green-900/50 dark:hover:border-pk-green-600"
                              }`}
                            >
                              <span className="font-medium text-zinc-800 dark:text-pk-green-200">{proc.title}</span>
                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-pk-green-400">{proc.overview.slice(0, 100)}...</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Limitation Periods */}
            {activeTab === "limitation" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Limitation Periods under Limitation Act 1908</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">
                    Time limits within which legal proceedings must be initiated in Pakistani courts.
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-pk-green-800 dark:bg-pk-green-950">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-pk-green-800">
                      <thead className="bg-zinc-50 dark:bg-pk-green-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Article</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-pk-green-400">Period</th>
                          <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell dark:text-pk-green-400">Time Starts</th>
                          <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 xl:table-cell dark:text-pk-green-400">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-pk-green-800">
                        {(toolkit?.limitation_periods || []).map((item, i) => (
                          <tr key={i} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-pk-green-900/30">
                            <td className="px-4 py-3 text-sm font-medium text-pk-green-700 dark:text-pk-green-300">{item.article}</td>
                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-pk-green-200">{item.description}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                item.period.includes("12") || item.period.includes("Discretionary")
                                  ? "bg-pk-green-100 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300"
                                  : item.period.includes("1 year") || item.period.includes("6 months")
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : "bg-pk-gold-100 text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                              }`}>
                                {item.period}
                              </span>
                            </td>
                            <td className="hidden px-4 py-3 text-sm text-zinc-500 lg:table-cell dark:text-pk-green-400">{item.time_start}</td>
                            <td className="hidden px-4 py-3 text-sm text-zinc-400 xl:table-cell dark:text-pk-green-500">{item.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Court Fees */}
            {activeTab === "fees" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Court Fee Information</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">
                    Estimated court fees for various legal proceedings under the Court Fees Act 1870.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(toolkit?.court_fees || []).map((fee, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-pk-green-200 hover:shadow-md dark:border-pk-green-800 dark:bg-pk-green-950 dark:hover:border-pk-green-600"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-zinc-800 dark:text-pk-green-200">{fee.proceeding}</h3>
                          <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            fee.fee_type === "Fixed"
                              ? "bg-pk-green-100 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300"
                              : fee.fee_type === "Fixed + Ad Valorem"
                              ? "bg-pk-gold-100 text-pk-gold-800 dark:bg-pk-gold-900/50 dark:text-pk-gold-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          }`}>
                            {fee.fee_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-pk-green-700 dark:text-pk-green-300">{fee.estimated_fee}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-pk-green-300/70">{fee.fee_description}</p>
                      {fee.notes && (
                        <p className="mt-2 text-xs text-zinc-400 dark:text-pk-green-500">💡 {fee.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Bail Information */}
            {activeTab === "bail" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-pk-green-100">Bail Provisions in Pakistan</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-pk-green-400">
                    Information about bail under the Criminal Procedure Code 1898 and related laws.
                  </p>
                </div>
                <div className="space-y-4">
                  {bailInfo.map((bail, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-pk-green-200 hover:shadow-md dark:border-pk-green-800 dark:bg-pk-green-950 dark:hover:border-pk-green-600"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            bail.bailable
                              ? "bg-pk-green-100 dark:bg-pk-green-900"
                              : "bg-red-100 dark:bg-red-900"
                          }`}>
                            <span className={`text-lg ${bail.bailable ? "" : ""}`}>
                              {bail.bailable ? "✅" : "🔒"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-zinc-800 dark:text-pk-green-200">{bail.section}</h3>
                            <p className="text-sm text-zinc-600 dark:text-pk-green-300">{bail.offense_type}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          bail.bailable
                            ? "bg-pk-green-100 text-pk-green-800 dark:bg-pk-green-900 dark:text-pk-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            bail.bailable ? "bg-pk-green-500" : "bg-red-500"
                          }`} />
                          {bail.bailable ? "Bailable" : "Non-Bailable"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-zinc-600 dark:text-pk-green-300/80">{bail.conditions}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-pk-green-400">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                          </svg>
                          Jurisdiction: {bail.court}
                        </span>
                        {bail.notes && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            {bail.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Procedure Detail Modal/Expanded View */}
            {selectedProcedure && toolkit && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20 backdrop-blur-sm">
                <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-pk-green-700 dark:bg-pk-green-950">
                  {(() => {
                    const proc = toolkit.procedures
                      .flatMap((c) => c.procedures)
                      .find((p) => p.id === selectedProcedure);
                    if (!proc) return null;
                    return (
                      <>
                        <div className="border-b border-zinc-100 px-6 py-4 dark:border-pk-green-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-medium uppercase tracking-wider text-pk-gold-600 dark:text-pk-gold-400">{proc.category}</span>
                              <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-pk-green-100">{proc.title}</h2>
                            </div>
                            <button
                              onClick={() => setSelectedProcedure(null)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-pk-green-700 dark:text-pk-green-400 dark:hover:bg-pk-green-900"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                          <p className="text-sm leading-relaxed text-zinc-600 dark:text-pk-green-300/80">{proc.overview}</p>

                          {proc.applicable_laws.length > 0 && (
                            <div className="mt-4 rounded-lg bg-pk-green-50 p-3 dark:bg-pk-green-900/50">
                              <p className="text-xs font-semibold uppercase tracking-wider text-pk-green-700 dark:text-pk-green-400">Applicable Laws</p>
                              <ul className="mt-1 space-y-0.5">
                                {proc.applicable_laws.map((law, i) => (
                                  <li key={i} className="text-sm text-pk-green-800 dark:text-pk-green-300">• {law}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="mt-5 space-y-4">
                            {proc.steps.map((step) => (
                              <div key={step.step_number} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-pk-green-800 dark:bg-pk-green-900/30">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pk-gold-500 text-xs font-bold text-white">
                                    {step.step_number}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-zinc-800 dark:text-pk-green-200">{step.title}</h4>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-pk-green-300/80">{step.description}</p>
                                    {step.documents_required.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-pk-gold-700 dark:text-pk-gold-400">Documents required:</p>
                                        <ul className="mt-0.5 space-y-0.5">
                                          {step.documents_required.map((doc, j) => (
                                            <li key={j} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-pk-green-400">
                                              <span className="h-1 w-1 rounded-full bg-pk-gold-500" />
                                              {doc}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {step.tips && (
                                      <p className="mt-2 text-xs text-pk-green-600 dark:text-pk-gold-400">💡 {step.tips}</p>
                                    )}
                                    {step.estimated_time && (
                                      <p className="mt-1 text-xs text-zinc-400 dark:text-pk-green-500">⏱️ Estimated: {step.estimated_time}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {proc.notes && (
                            <div className="mt-4 rounded-lg border border-pk-gold-200 bg-pk-gold-50/50 p-3 dark:border-pk-gold-800 dark:bg-pk-gold-900/20">
                              <p className="text-xs font-medium text-pk-gold-700 dark:text-pk-gold-400">Notes</p>
                              <p className="mt-0.5 text-sm text-pk-gold-800 dark:text-pk-gold-300">{proc.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-zinc-100 px-6 py-3 dark:border-pk-green-800">
                          <button
                            onClick={() => setSelectedProcedure(null)}
                            className="rounded-lg bg-pk-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuickAccessCard({
  icon,
  title,
  description,
  count,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:border-pk-green-300 hover:shadow-md dark:border-pk-green-800 dark:bg-pk-green-950 dark:hover:border-pk-green-600"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pk-green-50 to-pk-gold-50 transition-transform group-hover:scale-110 dark:from-pk-green-900/50 dark:to-pk-gold-900/30">
        <span className="text-xl">{icon}</span>
      </div>
      <h3 className="font-semibold text-zinc-800 group-hover:text-pk-green-700 dark:text-pk-green-200 dark:group-hover:text-pk-green-300">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-pk-green-400">{description}</p>
      <p className="mt-2 text-xs font-medium text-pk-green-600 dark:text-pk-gold-400">{count} entries →</p>
    </button>
  );
}
