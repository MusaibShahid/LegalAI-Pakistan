import json
import re
from typing import Optional
from sqlalchemy import select, or_, and_, cast, String, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.judgment import Judgment
from app.models.law import LawSection
from app.schemas.search import SearchResultItem, SearchResponse, SearchSuggestion
from app.services.query_classifier import QueryClassifier, ClassifiedQuery
from app.services.ranking import RankingEngine
from app.services.cache import cache_service


def _escape_like(s: str) -> str:
    """Escape SQL LIKE special characters."""
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _fts_query(query: str) -> str:
    """Convert a user query into a proper FTS5 MATCH query string.

    Handles:
    - Simple words: tokenizes and joins with implicit AND
    - Phrase search: "exact phrase"
    - Prefix matching: word* for partial matches
    - Cleaning: remove special FTS characters that could cause errors
    """
    # Remove characters that are special in FTS5 syntax
    cleaned = re.sub(r'[()^$\[\]{}]', ' ', query)
    words = cleaned.split()
    if not words:
        return ""

    fts_parts = []
    i = 0
    while i < len(words):
        word = words[i]
        # Handle quoted phrases
        if word.startswith('"') or word.startswith("'"):
            phrase = word
            i += 1
            while i < len(words) and not (word.endswith('"') or word.endswith("'")):
                phrase += " " + words[i]
                i += 1
            fts_parts.append(phrase)
            continue

        # Clean word and add prefix matching for better recall
        word_clean = re.sub(r'[^\w\-]', '', word)
        if len(word_clean) >= 3:
            # Use prefix matching for better recall
            fts_parts.append(f'{word_clean}*')
        elif word_clean:
            fts_parts.append(word_clean)
        i += 1

    if not fts_parts:
        return ""

    # Join with implicit AND
    return " AND ".join(fts_parts)


def _make_snippet(full_text: str, query: str, max_len: int = 300) -> str:
    """Extract a relevant snippet from full_text around the query match."""
    if not full_text:
        return ""
    # Try to find the query (or first word) in the text
    lower_text = full_text.lower()
    words = query.lower().split()
    best_pos = -1
    for word in words:
        if len(word) >= 3:
            pos = lower_text.find(word)
            if pos != -1:
                best_pos = pos
                break
    if best_pos == -1:
        # Just take the first chunk
        snippet = full_text[:max_len]
    else:
        # Center the match in the snippet
        start = max(0, best_pos - max_len // 3)
        end = min(len(full_text), start + max_len)
        snippet = full_text[start:end]
        if start > 0:
            snippet = "..." + snippet
        if end < len(full_text):
            snippet = snippet + "..."
    # Clean up whitespace
    snippet = " ".join(snippet.split())
    return snippet[:max_len + 3]


class SearchService:
    """Orchestrates search across all legal sources.

    Uses SQLite FTS5 for full-text keyword searches, with fallback to
    LIKE-based search for citation/section lookups and backward compatibility.
    """

    def __init__(self):
        self.classifier = QueryClassifier()
        self.ranking = RankingEngine()

    async def search(
        self,
        query: str,
        db: AsyncSession,
        court: Optional[str] = None,
        judge: Optional[str] = None,
        year: Optional[int] = None,
        law: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        subject: Optional[str] = None,
        case_type: Optional[str] = None,
        court_level: Optional[str] = None,
        search_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SearchResponse:
        # Check cache first
        cache_key = f"{query}:{court}:{judge}:{year}:{law}:{jurisdiction}:{subject}:{case_type}:{court_level}:{search_type}:{page}:{page_size}"
        cached = await cache_service.get("search", cache_key)
        if cached:
            return SearchResponse(**cached)

        # Classify the query
        classified = self.classifier.classify(query)

        # Search judgments and/or law sections based on search_type filter
        judgment_results = []
        law_results = []
        if not search_type or search_type == "judgment":
            judgment_results = await self._search_judgments(classified, db, court, judge, year, law, jurisdiction, subject, case_type, court_level)
        if not search_type or search_type == "law":
            law_results = await self._search_laws(classified, db, law)

        results = judgment_results + law_results

        # Rank results
        ranked = self.ranking.rank(results, query, classified.search_type)

        # Paginate
        total = len(ranked)
        start = (page - 1) * page_size
        end = start + page_size
        page_results = ranked[start:end]

        # Build response
        items = [
            SearchResultItem(
                id=str(r.get("id", "")),
                title=r.get("title", ""),
                citation=r.get("citation", ""),
                court=r.get("court", ""),
                date=str(r.get("date", "")),
                sections=r.get("sections", []),
                description=r.get("description", ""),
                content_snippet=_make_snippet(r.get("full_text", ""), query),
                source_url=r.get("source_url", ""),
                pdf_url=r.get("pdf_url"),
                score=r.get("score", 0.0),
                type=r.get("type", "judgment"),
            )
            for r in page_results
        ]

        response = SearchResponse(
            results=items,
            total=total,
            query=query,
            search_type=classified.search_type,
            page=page,
            page_size=page_size,
        )

        # Cache the result
        await cache_service.set("search", cache_key, response.model_dump())

        return response

    async def _search_judgments(
        self,
        classified: ClassifiedQuery,
        db: AsyncSession,
        court: Optional[str] = None,
        judge: Optional[str] = None,
        year: Optional[int] = None,
        law: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        subject: Optional[str] = None,
        case_type: Optional[str] = None,
        court_level: Optional[str] = None,
    ) -> list[dict]:
        """Execute search against the judgments table.

        Uses FTS5 for keyword/case_number/party searches, and LIKE-based
        search for citation/section/court lookups.
        """

        # --- Use FTS5 for full-text keyword search ---
        if classified.search_type in ("keyword", "case_number", "party"):
            return await self._search_judgments_fts(classified, db, court, judge, year, law, jurisdiction, subject, case_type, court_level)

        # --- Use LIKE-based search for citation/section/court lookups ---
        stmt = select(Judgment)
        filters = []

        if classified.search_type == "citation" and classified.citation:
            q = _escape_like(classified.citation)
            filters.append(Judgment.citation.ilike(f"%{q}%"))
        elif classified.search_type == "section" and classified.section:
            q = _escape_like(classified.section)
            parts = q.split()
            reversed_q = " ".join(reversed(parts)) if len(parts) == 2 else q
            filters.append(
                or_(
                    Judgment.title.ilike(f"%{q}%"),
                    Judgment.title.ilike(f"%{reversed_q}%"),
                    Judgment.sections_referenced.ilike(f"%{q}%"),
                    Judgment.sections_referenced.ilike(f"%{reversed_q}%"),
                    Judgment.description.ilike(f"%{q}%"),
                    Judgment.description.ilike(f"%{reversed_q}%"),
                )
            )
        elif classified.search_type == "court" and classified.court:
            q = _escape_like(classified.court)
            filters.append(Judgment.court.ilike(f"%{q}%"))
            if classified.year:
                filters.append(cast(Judgment.date, String).like(f"{classified.year}%"))

        # Apply user-specified filters
        if court:
            q = _escape_like(court)
            filters.append(Judgment.court.ilike(f"%{q}%"))
        if judge:
            q = _escape_like(judge)
            filters.append(Judgment.judge.ilike(f"%{q}%"))
        if year:
            filters.append(cast(Judgment.date, String).like(f"{year}%"))
        if law:
            q = _escape_like(law)
            filters.append(
                or_(
                    Judgment.title.ilike(f"%{q}%"),
                    Judgment.sections_referenced.ilike(f"%{q}%"),
                )
            )
        if jurisdiction:
            q = _escape_like(jurisdiction)
            filters.append(Judgment.court.ilike(f"%{q}%"))
        if subject:
            q = _escape_like(subject)
            filters.append(
                or_(
                    Judgment.title.ilike(f"%{q}%"),
                    Judgment.description.ilike(f"%{q}%"),
                    Judgment.full_text.ilike(f"%{q}%"),
                )
            )
        if case_type:
            q = _escape_like(case_type)
            filters.append(
                or_(
                    Judgment.title.ilike(f"%{q}%"),
                    Judgment.description.ilike(f"%{q}%"),
                )
            )
        if court_level:
            q = _escape_like(court_level)
            filters.append(Judgment.court.ilike(f"%{q}%"))

        if filters:
            stmt = stmt.where(and_(*filters))

        stmt = stmt.limit(500)
        result = await db.execute(stmt)
        judgments = result.scalars().all()

        return [
            {
                "id": str(j.id),
                "title": j.title,
                "citation": j.citation,
                "court": j.court,
                "date": str(j.date) if j.date else "",
                "sections": json.loads(j.sections_referenced) if j.sections_referenced else [],
                "description": j.description or "",
                "full_text": j.full_text or "",
                "source_url": j.source_url,
                "pdf_url": j.pdf_url,
                "year": j.date.year if j.date else None,
                "type": "judgment",
                "_fts_score": 0.0,
            }
            for j in judgments
        ]

    async def _search_judgments_fts(
        self,
        classified: ClassifiedQuery,
        db: AsyncSession,
        court: Optional[str] = None,
        judge: Optional[str] = None,
        year: Optional[int] = None,
        law: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        subject: Optional[str] = None,
        case_type: Optional[str] = None,
        court_level: Optional[str] = None,
    ) -> list[dict]:
        """Execute full-text search using FTS5 on judgments."""
        fts_q = _fts_query(classified.normalized_query)
        if not fts_q:
            return []

        # Build FTS query with bm25 scoring
        # Use the rank from FTS5 (BM25) as the base relevance score
        try:
            # Start with FTS5 MATCH on the virtual table
            base_sql = """
                SELECT j.*, bm25(judgments_fts, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 0) AS fts_score
                FROM judgments j
                INNER JOIN judgments_fts ON j.id = judgments_fts.rowid
                WHERE judgments_fts MATCH :fts_query
            """

            params: dict = {"fts_query": fts_q}
            where_clauses = []

            if court:
                where_clauses.append("j.court ILIKE :court")
                params["court"] = f"%{court}%"
            if judge:
                where_clauses.append("j.judge ILIKE :judge")
                params["judge"] = f"%{judge}%"
            if year:
                where_clauses.append("CAST(j.date AS TEXT) LIKE :year")
                params["year"] = f"{year}%"
            if law:
                like_law = f"%{_escape_like(law)}%"
                where_clauses.append(f"(j.title ILIKE :law OR j.sections_referenced ILIKE :law)")
                params["law"] = like_law
            if jurisdiction:
                where_clauses.append("j.court ILIKE :jurisdiction")
                params["jurisdiction"] = f"%{jurisdiction}%"
            if subject:
                like_subj = f"%{_escape_like(subject)}%"
                where_clauses.append("(j.title ILIKE :subject OR j.description ILIKE :subject OR j.full_text ILIKE :subject)")
                params["subject"] = like_subj
            if case_type:
                like_ct = f"%{_escape_like(case_type)}%"
                where_clauses.append("(j.title ILIKE :case_type OR j.description ILIKE :case_type)")
                params["case_type"] = like_ct
            if court_level:
                where_clauses.append("j.court ILIKE :court_level")
                params["court_level"] = f"%{court_level}%"

            if where_clauses:
                base_sql += " AND " + " AND ".join(where_clauses)

            base_sql += " ORDER BY fts_score LIMIT 500"

            result = await db.execute(text(base_sql), params)
            rows = [dict(row._mapping) for row in result.all()]
        except Exception:
            # Fallback: if FTS fails (e.g., table not created yet), use LIKE search
            stmt = select(Judgment)
            keyword = _escape_like(classified.normalized_query)
            filters = [
                or_(
                    Judgment.title.ilike(f"%{keyword}%"),
                    Judgment.description.ilike(f"%{keyword}%"),
                    Judgment.full_text.ilike(f"%{keyword}%"),
                    Judgment.citation.ilike(f"%{keyword}%"),
                )
            ]
            stmt = stmt.where(and_(*filters)).limit(500)
            result = await db.execute(stmt)
            rows = []
            for j in result.scalars().all():
                rows.append({
                    "id": j.id,
                    "title": j.title,
                    "citation": j.citation,
                    "court": j.court,
                    "date": j.date,
                    "sections_referenced": j.sections_referenced,
                    "description": j.description,
                    "full_text": j.full_text,
                    "source_url": j.source_url,
                    "pdf_url": j.pdf_url,
                    "judge": j.judge,
                    "bench": j.bench,
                    "case_number": j.case_number,
                    "fts_score": 0.0,
                })
            return [
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "citation": r["citation"],
                    "court": r["court"],
                    "date": str(r["date"]) if r.get("date") else "",
                    "sections": json.loads(r.get("sections_referenced", "[]")) if r.get("sections_referenced") else [],
                    "description": r.get("description", ""),
                    "full_text": r.get("full_text", ""),
                    "source_url": r.get("source_url", ""),
                    "pdf_url": r.get("pdf_url"),
                    "year": r.get("date").year if r.get("date") else None,
                    "type": "judgment",
                    "_fts_score": float(r.get("fts_score", 0)),
                }
                for r in rows
            ]

        return [
            {
                "id": str(row["id"]),
                "title": row["title"],
                "citation": row["citation"],
                "court": row["court"],
                "date": str(row["date"]) if row.get("date") else "",
                "sections": json.loads(row.get("sections_referenced", "[]")) if row.get("sections_referenced") else [],
                "description": row.get("description", ""),
                "full_text": row.get("full_text", ""),
                "source_url": row.get("source_url", ""),
                "pdf_url": row.get("pdf_url"),
                "year": int(str(row["date"])[:4]) if row.get("date") else None,
                "type": "judgment",
                "_fts_score": -float(row.get("fts_score", 0)),
            }
            for row in rows
        ]

    async def _search_laws(
        self,
        classified: ClassifiedQuery,
        db: AsyncSession,
        law: Optional[str] = None,
    ) -> list[dict]:
        """Execute search against the law sections table.

        Uses FTS5 for keyword searches, LIKE for section-specific lookups.
        """

        # Use FTS5 for keyword searches
        if classified.search_type == "keyword":
            return await self._search_laws_fts(classified, db, law)

        # LIKE-based search for section/article lookups
        stmt = select(LawSection)
        filters = []

        if classified.search_type == "section" and classified.section:
            q = _escape_like(classified.section)
            section_parts = q.split()
            section_num = section_parts[0] if section_parts else q
            filters.append(
                or_(
                    LawSection.section_number.ilike(f"%{section_num}%"),
                    LawSection.section_text.ilike(f"%{q}%"),
                    LawSection.law_name.ilike(f"%{q}%"),
                )
            )

        if law:
            q = _escape_like(law)
            filters.append(
                or_(
                    LawSection.law_name.ilike(f"%{q}%"),
                    LawSection.section_number.ilike(f"%{q}%"),
                    LawSection.section_text.ilike(f"%{q}%"),
                )
            )

        if not filters:
            return []

        stmt = stmt.where(and_(*filters)).limit(100)
        result = await db.execute(stmt)
        laws = result.scalars().all()

        return [
            {
                "id": str(l.id),
                "title": f"{l.law_name} - Section {l.section_number}",
                "citation": f"Section {l.section_number}",
                "court": "Pakistan Code",
                "date": "",
                "sections": [l.section_number],
                "description": l.section_text[:300] if l.section_text else "",
                "full_text": l.section_text or "",
                "source_url": l.source_url,
                "pdf_url": None,
                "year": None,
                "type": "law",
                "_fts_score": 0.0,
            }
            for l in laws
        ]

    async def _search_laws_fts(
        self,
        classified: ClassifiedQuery,
        db: AsyncSession,
        law: Optional[str] = None,
    ) -> list[dict]:
        """Execute FTS5 search against law sections."""
        fts_q = _fts_query(classified.normalized_query)
        if not fts_q:
            return []

        try:
            base_sql = """
                SELECT l.*, bm25(law_sections_fts, 0, 1.0, 2.0, 3.0) AS fts_score
                FROM law_sections l
                INNER JOIN law_sections_fts ON l.id = law_sections_fts.rowid
                WHERE law_sections_fts MATCH :fts_query
            """
            params: dict = {"fts_query": fts_q}

            if law:
                like_law = f"%{_escape_like(law)}%"
                base_sql += " AND (l.law_name ILIKE :law OR l.section_number ILIKE :law)"
                params["law"] = like_law

            base_sql += " ORDER BY fts_score LIMIT 100"

            result = await db.execute(text(base_sql), params)
            rows = [dict(row._mapping) for row in result.all()]
        except Exception:
            # Fallback to LIKE
            keyword = _escape_like(classified.normalized_query)
            filters = [
                or_(
                    LawSection.law_name.ilike(f"%{keyword}%"),
                    LawSection.section_number.ilike(f"%{keyword}%"),
                    LawSection.section_text.ilike(f"%{keyword}%"),
                )
            ]
            if law:
                q = _escape_like(law)
                filters.append(
                    or_(
                        LawSection.law_name.ilike(f"%{q}%"),
                        LawSection.section_number.ilike(f"%{q}%"),
                        LawSection.section_text.ilike(f"%{q}%"),
                    )
                )
            stmt = select(LawSection).where(and_(*filters)).limit(100)
            result = await db.execute(stmt)
            rows = result.scalars().all()
            return [
                {
                    "id": str(l.id),
                    "title": f"{l.law_name} - Section {l.section_number}",
                    "citation": f"Section {l.section_number}",
                    "court": "Pakistan Code",
                    "date": "",
                    "sections": [l.section_number],
                    "description": l.section_text[:300] if l.section_text else "",
                    "full_text": l.section_text or "",
                    "source_url": l.source_url,
                    "pdf_url": None,
                    "year": None,
                    "type": "law",
                    "_fts_score": 0.0,
                }
                for l in rows
            ]

        return [
            {
                "id": str(row["id"]),
                "title": f'{row["law_name"]} - Section {row["section_number"]}',
                "citation": f'Section {row["section_number"]}',
                "court": "Pakistan Code",
                "date": "",
                "sections": [row["section_number"]],
                "description": (row["section_text"] or "")[:300],
                "full_text": row["section_text"] or "",
                "source_url": row["source_url"],
                "pdf_url": None,
                "year": None,
                "type": "law",
                "_fts_score": -float(row.get("fts_score", 0)),
            }
            for row in rows
        ]

    async def get_suggestions(self, query: str, db: AsyncSession) -> list[SearchSuggestion]:
        """Generate search suggestions based on partial input."""
        if len(query) < 2:
            return []

        suggestions = []
        safe_query = _escape_like(query)

        # Try to classify the partial query
        classified = self.classifier.classify(query)

        # Add suggestion based on classification
        if classified.search_type in ("citation", "section", "case_number"):
            suggestions.append(
                SearchSuggestion(text=classified.normalized_query, type=classified.search_type)
            )

        # Search for matching citations in DB
        stmt = (
            select(Judgment.citation)
            .where(Judgment.citation.ilike(f"%{safe_query}%"))
            .distinct()
            .limit(5)
        )
        result = await db.execute(stmt)
        for row in result:
            suggestions.append(SearchSuggestion(text=row[0], type="citation"))

        # Search for matching titles
        stmt = (
            select(Judgment.title)
            .where(Judgment.title.ilike(f"%{safe_query}%"))
            .limit(5)
        )
        result = await db.execute(stmt)
        for row in result:
            suggestions.append(SearchSuggestion(text=row[0][:80], type="keyword"))

        # Search for matching law sections
        stmt = (
            select(LawSection.section_number, LawSection.law_name)
            .where(
                or_(
                    LawSection.section_number.ilike(f"%{safe_query}%"),
                    LawSection.law_name.ilike(f"%{safe_query}%"),
                    LawSection.section_text.ilike(f"%{safe_query}%"),
                )
            )
            .limit(5)
        )
        result = await db.execute(stmt)
        for row in result:
            suggestions.append(SearchSuggestion(text=f"Section {row[0]} - {row[1]}", type="section"))

        # Add common legal suggestions if query matches
        common_terms = {
            "bail": ["Bail in bailable offences", "Bail in non-bailable offences", "Anticipatory bail"],
            "murder": ["Section 302 PPC - Murder", "Section 304 PPC - Culpable homicide"],
            "theft": ["Section 378 PPC - Theft", "Section 379 PPC - Punishment for theft"],
            "cheat": ["Section 415 PPC - Cheating", "Section 420 PPC - Cheating and dishonestly"],
            "fraud": ["Section 420 PPC - Fraud", "Section 468 PPC - Forgery for cheating"],
            "divorce": ["Section 7 Muslim Family Law - Divorce", "Khula under Muslim Family Law"],
            "maintenance": ["Section 125 CrPC - Maintenance", "Muslim Family Law - Maintenance"],
            "cyber": ["Section 20 PECA - Offences against dignity", "Section 21 PECA - Cyber stalking"],
            "tax": ["Income Tax Ordinance", "Sales Tax Act"],
            "constitution": ["Article 199 - Writ jurisdiction", "Article 184 - Suo motu"],
        }
        for term, items in common_terms.items():
            if term.startswith(safe_query.lower()):
                for item in items[:2]:
                    suggestions.append(SearchSuggestion(text=item, type="section"))

        return suggestions[:8]


search_service = SearchService()
