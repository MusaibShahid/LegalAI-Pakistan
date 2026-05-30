from datetime import datetime
from typing import Any
from app.core.metadata import compute_relevance_score


class RankingEngine:
    """Ranks legal search results using a priority-based scoring system.

    Priority order:
    1. FTS/BM25 Base Score (from SQLite FTS5) — preserved as foundation
    2. Exact Citation Match (+100)
    3. Exact Section Match (+80)
    4. Exact Case Number Match (+75)
    5. Party Name Match (+60)
    6. Court Authority (+30 max)
    7. Recent Judgments (+20 max)
    8. Keyword Relevance (variable, up to +50)
    9. Full-Text freshness bonus
    """

    AUTHORITY_SCORES = {
        "Supreme Court of Pakistan": 30,
        "Supreme Court": 28,
        "Federal Shariat Court": 25,
        "Lahore High Court": 20,
        "Sindh High Court": 20,
        "Islamabad High Court": 20,
        "Peshawar High Court": 18,
        "Balochistan High Court": 18,
        "AJK Supreme Court": 18,
        "AJK High Court": 15,
        "Gilgit-Baltistan Supreme Appellate Court": 15,
        "Supreme Appellate Court": 15,
        "Service Tribunal": 10,
        "Federal Service Tribunal": 10,
    }

    def rank(
        self,
        results: list[dict[str, Any]],
        query: str,
        search_type: str = "keyword",
    ) -> list[dict[str, Any]]:
        for result in results:
            score = 0.0

            # 0. Preserve any existing FTS score (passed in from FTS5 search)
            fts_score = result.get("_fts_score", 0.0)
            if fts_score:
                score += fts_score

            # 1. Citation match (most specific)
            if search_type == "citation":
                citation = result.get("citation", "")
                if query.strip().lower() == citation.strip().lower():
                    score += 100.0
                elif any(word in citation.lower() for word in query.lower().split()):
                    score += 40.0

            # 2. Section match
            if search_type == "section":
                sections = result.get("sections", [])
                section_query = query.strip().lower()
                if any(section_query in s.lower() for s in sections):
                    score += 80.0
                # Also check title/description for section reference
                title = result.get("title", "").lower()
                desc = result.get("description", "").lower()
                text = title + " " + desc
                if section_query in text:
                    score += 50.0

            # 3. Case number match
            if search_type == "case_number":
                case_number = result.get("case_number", "") or ""
                if case_number and query.strip().lower() in case_number.lower():
                    score += 75.0

            # 4. Party name match
            if search_type == "party":
                title = result.get("title", "").lower()
                title_words = set(title.split())
                query_words = set(query.lower().split())
                # Remove common stopwords
                stopwords = {"v.", "vs", "the", "of", "and", "in", "re"}
                title_words -= stopwords
                query_words -= stopwords
                if query_words:
                    overlap = len(query_words & title_words)
                    overlap_ratio = overlap / max(len(query_words), 1)
                    if overlap_ratio > 0.5:
                        score += 60.0 * overlap_ratio

            # 5 & 6. Keyword relevance (only for non-FTS scores)
            if not fts_score:
                relevance = compute_relevance_score(
                    query=query,
                    title=result.get("title", ""),
                    citation=result.get("citation", ""),
                    description=result.get("description", ""),
                    full_text=result.get("full_text", ""),
                )
                score += relevance

            # 7. Court authority
            court = result.get("court", "")
            best_authority = 0
            for court_name, auth_score in self.AUTHORITY_SCORES.items():
                if court_name.lower() in court.lower():
                    best_authority = max(best_authority, auth_score)
            score += best_authority

            # 8. Recency (more fine-grained)
            year = result.get("year")
            if year is not None:
                current_year = datetime.now().year
                years_diff = current_year - int(year)
                if years_diff <= 1:
                    recency = 20
                elif years_diff <= 3:
                    recency = 18
                elif years_diff <= 5:
                    recency = 15
                elif years_diff <= 10:
                    recency = 10
                elif years_diff <= 15:
                    recency = 5
                else:
                    recency = 2
                score += recency

            # 9. Small bonus for judgments over law sections (judgments have richer text)
            if result.get("type") == "judgment":
                score += 2.0

            result["_score"] = round(score, 2)

        # Sort by score descending
        results.sort(key=lambda r: r.get("_score", 0), reverse=True)

        # Copy score to public field
        for result in results:
            result["score"] = result.pop("_score", 0)

        return results
