import { SearchResponse, Judgment, LawSection, SearchFilters, SearchSuggestion } from "@/types";

const isProduction = process.env.NODE_ENV === 'production';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LatestJudgment {
  id: string;
  title: string;
  citation: string;
  court: string;
  judge: string | null;
  date: string;
  case_number: string | null;
  sections: string[];
  description: string;
  source_url: string;
  pdf_url: string | null;
}

function getApiUrl(path: string, params?: Record<string, string>): string {
  const baseUrl = isProduction ? path : `${API_BASE}${path}`;
  const url = new URL(baseUrl, isProduction ? 'http://localhost' : undefined);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  
  return isProduction ? url.pathname + url.search : url.toString();
}

async function fetchAPI<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = getApiUrl(path, params);
  
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getUnifiedSuggestions(
  query: string
): Promise<import("@/types").UnifiedSuggestion[]> {
  try {
    const res = await fetchAPI<{ suggestions: import("@/types").UnifiedSuggestion[] }>("/api/unified-search/suggestions", { q: query });
    return res.suggestions || [];
  } catch {
    return [];
  }
}

export interface UnifiedSearchFilters {
  court?: string;
  year?: number;
  judge?: string;
  law?: string;
  topic?: string;
  magazine?: string;
  author?: string;
  source_type?: string;
}

export async function unifiedSearch(
  query: string,
  filters?: UnifiedSearchFilters,
  limitPerType = 6
): Promise<import("@/types").UnifiedSearchResponse> {
  return fetchAPI<import("@/types").UnifiedSearchResponse>("/api/unified-search/", {
    q: query,
    ...(filters?.court && { court: filters.court }),
    ...(filters?.year && { year: String(filters.year) }),
    ...(filters?.judge && { judge: filters.judge }),
    ...(filters?.law && { law: filters.law }),
    ...(filters?.topic && { topic: filters.topic }),
    ...(filters?.magazine && { magazine: filters.magazine }),
    ...(filters?.author && { author: filters.author }),
    ...(filters?.source_type && { source_type: filters.source_type }),
    limit_per_type: String(limitPerType),
  });
}

export async function search(
  query: string,
  filters?: SearchFilters,
  page = 1,
  pageSize = 20
): Promise<SearchResponse> {
  return fetchAPI<SearchResponse>("/api/search", {
    q: query,
    ...(filters?.court && { court: filters.court }),
    ...(filters?.judge && { judge: filters.judge }),
    ...(filters?.year && { year: String(filters.year) }),
    ...(filters?.jurisdiction && { jurisdiction: filters.jurisdiction }),
    ...(filters?.law && { law: filters.law }),
    ...(filters?.subject && { subject: filters.subject }),
    ...(filters?.caseType && { case_type: filters.caseType }),
    ...(filters?.courtLevel && { court_level: filters.courtLevel }),
    page: String(page),
    page_size: String(pageSize),
  });
}

export async function getJudgment(id: string): Promise<Judgment> {
  return fetchAPI<Judgment>(`/api/judgments/${id}`);
}

export async function getLawSection(id: string): Promise<LawSection> {
  return fetchAPI<LawSection>(`/api/laws/${id}`);
}

export async function getSuggestions(query: string): Promise<SearchSuggestion[]> {
  return fetchAPI<SearchSuggestion[]>("/api/suggestions", { q: query });
}

export function getPdfDownloadUrl(judgmentId: string): string {
  return `/api/judgments/${judgmentId}/pdf`;
}

export async function getLatestJudgments(limit = 10, court?: string): Promise<LatestJudgment[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (court) params.court = court;
  return fetchAPI<LatestJudgment[]>("/api/judgments/latest", params);
}

/* ========== SCP Portal Latest Judgments ========== */

export interface SCPJudgment {
  sr_no: string;
  case_subject: string;
  case_number: string;
  case_title: string;
  author_judge: string;
  judgment_date: string;
  upload_date: string;
  citation: string;
  sc_citation: string;
  pdf_url: string;
  source_url: string;
}

export interface SCPCitation {
  sc_citation: string;
  citation: string;
  case_title: string;
  case_number: string;
  judge: string;
  date: string;
}

export interface SCPJudgmentsResponse {
  judgments: SCPJudgment[];
  total: number;
  source: string;
  url: string;
  message?: string;
}

export interface SCPCitationsResponse {
  citations: SCPCitation[];
  total: number;
  source: string;
}

export async function getSCPLatestJudgments(
  limit = 25,
  filters?: { court?: string; judge?: string; subject?: string; year?: number }
): Promise<SCPJudgmentsResponse> {
  const params: Record<string, string> = { limit: String(limit) };
  if (filters?.court) params.court = filters.court;
  if (filters?.judge) params.judge = filters.judge;
  if (filters?.subject) params.subject = filters.subject;
  if (filters?.year) params.year = String(filters.year);
  return fetchAPI<SCPJudgmentsResponse>("/api/scp/latest-judgments", params);
}

export async function getSCPCitations(limit = 50, year?: number): Promise<SCPCitationsResponse> {
  const params: Record<string, string> = { limit: String(limit) };
  if (year) params.year = String(year);
  return fetchAPI<SCPCitationsResponse>("/api/scp/citations", params);
}

/* ========== Free Citation Search ========== */

export interface ParsedCitation {
  year: string;
  reporter: string;
  page: string;
  court: string;
  raw: string;
  confidence: number;
  search_urls: { source: string; url: string; search_type: string; description: string }[];
}

export interface CitationSearchResponse {
  query: string;
  parsed: ParsedCitation | null;
  citations_found: ParsedCitation[];
  sources: { source: string; url: string; search_type: string; description: string }[];
  message: string;
}

export async function searchCitation(query: string): Promise<CitationSearchResponse> {
  return fetchAPI<CitationSearchResponse>("/api/citations/search", { q: query });
}

export async function parseAndSearchCitation(text: string): Promise<CitationSearchResponse> {
  const res = await fetch(getApiUrl("/api/citations/parse"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getReporters(): Promise<{ code: string; full_name: string; court: string }[]> {
  const result = await fetchAPI<{ reporters: { code: string; full_name: string; court: string }[] }>("/api/citations/reporters");
  return result.reporters;
}

/* ========== Legal Tools API ========== */

export async function getToolkit(): Promise<import("@/types").LegalToolkit> {
  return fetchAPI<import("@/types").LegalToolkit>("/api/tools/toolkit");
}

export async function getBailInfo(): Promise<import("@/types").BailInfo[]> {
  return fetchAPI<import("@/types").BailInfo[]>("/api/tools/bail");
}

export async function getLimitationPeriods(): Promise<import("@/types").LimitationInfo[]> {
  return fetchAPI<import("@/types").LimitationInfo[]>("/api/tools/limitation-periods");
}

export async function getCourtFees(): Promise<import("@/types").CourtFeeInfo[]> {
  return fetchAPI<import("@/types").CourtFeeInfo[]>("/api/tools/court-fees");
}

export async function getProcedures(): Promise<import("@/types").ProcedureCategory[]> {
  return fetchAPI<import("@/types").ProcedureCategory[]>("/api/tools/procedures");
}

export async function getProcedureById(id: string): Promise<import("@/types").LegalProcedure | null> {
  return fetchAPI<import("@/types").LegalProcedure>(`/api/tools/procedures/${id}`);
}

/* ========== Multi-Source Live Search ========== */

export interface LiveSearchResult {
  id: string;
  title: string;
  subtitle: string;
  citation: string;
  court: string;
  date: string;
  case_number: string;
  description: string;
  content_snippet: string;
  source_url: string;
  pdf_url: string | null;
  source_key: string;
  source_name: string;
  source: string;
  type: "judgment" | "law";
  score: number;
  sections: string[];
  url: string;
}

export interface LiveSearchResponse {
  query: string;
  search_type: string;
  total: number;
  results: LiveSearchResult[];
  categories: { judgments: number; laws: number };
  source_status: Record<string, string>;
  citation_info: {
    year: string;
    reporter: string;
    page: string;
    court: string;
    confidence: number;
  } | null;
  citation_urls: { source: string; url: string; search_type: string; description: string }[];
  search_time_ms: number;
  sources_checked: number;
  sources_succeeded: number;
}

export async function liveSearch(
  query: string,
  filters?: { court?: string; year?: number },
  sources?: string[]
): Promise<LiveSearchResponse> {
  const params: Record<string, string> = { q: query };
  if (filters?.court) params.court = filters.court;
  if (filters?.year) params.year = String(filters.year);
  if (sources?.length) params.sources = sources.join(",");
  return fetchAPI<LiveSearchResponse>("/api/unified-search/live", params);
}

/* ========== Source Status ========== */

export interface DataSource {
  key: string;
  name: string;
  type: string;
  status: string;
  base_url: string;
  capabilities: {
    judgments: boolean;
    laws: boolean;
    citations: boolean;
    sections: boolean;
    pdf: boolean;
  };
  success_rate: number;
  avg_response_ms: number;
  notes: string;
}

export async function getDataSources(): Promise<{ sources: DataSource[] }> {
  return fetchAPI<{ sources: DataSource[] }>("/api/unified-search/sources");
}

export async function getSourceHealth(): Promise<{ health: Record<string, { status: string; success_rate: number; total_requests: number; total_failures: number; avg_response_ms: number }> }> {
  return fetchAPI("/api/unified-search/sources/health");
}
