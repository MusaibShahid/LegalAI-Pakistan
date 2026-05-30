export interface SearchResult {
  id: string;
  title: string;
  citation: string;
  court: string;
  date: string;
  sections: string[];
  description: string;
  content_snippet?: string;
  source_url: string;
  pdf_url?: string;
  score: number;
  type: "judgment" | "law";
}

export interface Judgment {
  id: string;
  title: string;
  citation: string;
  court: string;
  bench?: string;
  judge?: string;
  date: string;
  case_number?: string;
  sections: string[];
  full_text: string;
  source_url: string;
  pdf_url?: string;
}

export interface LawSection {
  id: string;
  law_name: string;
  section_number: string;
  section_text: string;
  related_sections: string[];
  related_judgments: string[];
  source_url: string;
}

export interface SearchFilters {
  court?: string;
  judge?: string;
  year?: number;
  jurisdiction?: string;
  law?: string;
  subject?: string;
  caseType?: string;
  courtLevel?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  search_type: "citation" | "section" | "keyword" | "court";
  filters?: SearchFilters;
  page: number;
  page_size: number;
}

export interface SearchSuggestion {
  text: string;
  type: "citation" | "section" | "keyword" | "case_number";
}

/* Unified Search Types */
export interface UnifiedSuggestion {
  text: string;
  type: "citation" | "section" | "keyword";
  label: string;
}

export interface UnifiedSearchResult {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  content_snippet: string | null;
  type: "judgment" | "law" | "magazine";
  source: string;
  url: string;
  score: number;
  date: string;
  pdf_url: string | null;
  source_url: string | null;
}

export interface UnifiedSearchCategoryCounts {
  judgments: number;
  laws: number;
  magazines: number;
}

export interface CitationUrl {
  source: string;
  url: string;
  search_type: string;
  description: string;
}

export interface CitationParsedInfo {
  year: string;
  reporter: string;
  reporter_full_name: string;
  page: string;
  court: string;
  raw: string;
  confidence: number;
  search_urls: CitationUrl[];
}

export interface UnifiedSearchResponse {
  results: UnifiedSearchResult[];
  categories: UnifiedSearchCategoryCounts;
  total: number;
  query: string;
  citation_info: CitationParsedInfo | null;
}

/** Legal Tools Types */
export interface LimitationInfo {
  article: string;
  description: string;
  period: string;
  time_start: string;
  notes?: string;
}

export interface CourtFeeInfo {
  proceeding: string;
  fee_type: string;
  fee_description: string;
  estimated_fee: string;
  notes?: string;
}

export interface ProcedureStep {
  step_number: number;
  title: string;
  description: string;
  estimated_time?: string;
  documents_required: string[];
  tips?: string;
}

export interface LegalProcedure {
  id: string;
  title: string;
  category: string;
  overview: string;
  applicable_laws: string[];
  jurisdiction: string;
  steps: ProcedureStep[];
  notes?: string;
}

export interface ProcedureCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  procedures: LegalProcedure[];
}

export interface LegalToolkit {
  limitation_periods: LimitationInfo[];
  court_fees: CourtFeeInfo[];
  procedures: ProcedureCategory[];
}

export interface BailInfo {
  section: string;
  offense_type: string;
  bailable: boolean;
  conditions: string;
  court: string;
  notes?: string;
}
