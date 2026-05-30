import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, and_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from app.database import get_db
from app.models.judgment import Judgment
from app.models.law import LawSection
from app.models.magazine import MagazineArticle
from app.schemas.unified_search import UnifiedSearchResponse, UnifiedSearchResult, CategoryCounts, CitationParsedInfo, CitationUrl
from app.services.query_classifier import QueryClassifier
from app.services.search_service import _fts_query, _escape_like, _make_snippet
from app.core.citation_parser import parse_citation, build_search_urls, REPORTERS as CITATION_REPORTERS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/unified-search", tags=["unified-search"])

classifier = QueryClassifier()


def _judgment_to_result(j) -> UnifiedSearchResult:
    return UnifiedSearchResult(
        id=str(j.id),
        title=j.title,
        subtitle=j.citation,
        description=j.description or "",
        content_snippet=_make_snippet(j.full_text or "", j.citation or "", 200),
        type="judgment",
        source=j.court,
        url=f"/judgment/{j.id}",
        score=1.0,
        date=str(j.date) if j.date else "",
        pdf_url=j.pdf_url,
        source_url=j.source_url,
    )


def _law_to_result(l) -> UnifiedSearchResult:
    return UnifiedSearchResult(
        id=str(l.id),
        title=f"{l.law_name} - Section {l.section_number}",
        subtitle=f"Section {l.section_number}",
        description=(l.section_text or "")[:300],
        content_snippet=(l.section_text or "")[:200],
        type="law",
        source="Pakistan Code",
        url=f"/law/{l.id}",
        score=1.0,
        source_url=l.source_url,
    )


def _magazine_to_result(m) -> UnifiedSearchResult:
    return UnifiedSearchResult(
        id=str(m.id),
        title=m.title,
        subtitle=m.magazine_name,
        description=m.description or "",
        content_snippet=(m.description or "")[:200],
        type="magazine",
        source=m.magazine_name,
        url=f"/search/magazines?id={m.id}",
        score=1.0,
        date=str(m.year) if m.year else "",
        source_url=m.source_url,
    )


@router.get("/", response_model=UnifiedSearchResponse)
async def unified_search(
    q: str = Query(..., min_length=1, max_length=500),
    court: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    judge: Optional[str] = Query(None),
    law: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    magazine: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None, description="Comma-separated: judgment,law,magazine"),
    limit_per_type: int = Query(6, ge=1, le=20),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Unified realtime search across judgments, law sections, and magazine articles."""
    try:
        # Parse source_type filter
        types_to_include = None
        if source_type:
            types_to_include = set(t.strip().lower() for t in source_type.split(",") if t.strip())

        judgment_results = []
        law_results = []
        magazine_results = []

        if not types_to_include or "judgment" in types_to_include:
            judgment_results = await _search_judgments(q, db, court, year, judge, law, limit_per_type)
        if not types_to_include or "law" in types_to_include:
            law_results = await _search_laws(q, db, law, limit_per_type)
        if not types_to_include or "magazine" in types_to_include:
            magazine_results = await _search_magazines(q, db, topic, magazine, author, year, limit_per_type)

        # Combine results with sort: judgments first, then laws, then magazines
        all_results = judgment_results + law_results + magazine_results

        # Apply pagination
        total = len(all_results)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_results = all_results[start:end]

        categories = CategoryCounts(
            judgments=len(judgment_results),
            laws=len(law_results),
            magazines=len(magazine_results),
        )

        # Parse citation info from query
        citation_info = None
        try:
            parsed = parse_citation(q)
            if parsed:
                reporter_info = CITATION_REPORTERS.get(parsed.reporter, {})
                search_urls = build_search_urls(parsed)
                citation_info = CitationParsedInfo(
                    year=parsed.year,
                    reporter=parsed.reporter,
                    reporter_full_name=reporter_info.get("full_name", ""),
                    page=parsed.page,
                    court=parsed.court or reporter_info.get("court", ""),
                    raw=parsed.raw,
                    confidence=parsed.confidence,
                    search_urls=[
                        CitationUrl(**u) for u in search_urls
                    ],
                )
        except Exception:
            pass

        return UnifiedSearchResponse(
            results=paginated_results,
            categories=categories,
            total=total,
            query=q,
            page=page,
            page_size=page_size,
            citation_info=citation_info,
        )
    except Exception as e:
        logger.exception("Unified search error for query: %s", q)
        return UnifiedSearchResponse(results=[], categories=CategoryCounts(), total=0, query=q)


async def _search_judgments(
    q: str,
    db: AsyncSession,
    court: Optional[str] = None,
    year: Optional[int] = None,
    judge: Optional[str] = None,
    law: Optional[str] = None,
    limit: int = 6,
) -> list[UnifiedSearchResult]:
    """Search judgments using FTS5 with LIKE fallback."""
    classified = classifier.classify(q)

    # Try FTS5 first
    fts_q = _fts_query(classified.normalized_query)
    if fts_q:
        try:
            base_sql = """
                SELECT j.*, bm25(judgments_fts, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 0) AS fts_score
                FROM judgments j
                INNER JOIN judgments_fts ON j.id = judgments_fts.rowid
                WHERE judgments_fts MATCH :fts_query
            """
            params: dict = {"fts_query": fts_q}

            if court:
                base_sql += " AND j.court ILIKE :court"
                params["court"] = f"%{court}%"
            if year:
                base_sql += " AND CAST(j.date AS TEXT) LIKE :year"
                params["year"] = f"{year}%"
            if judge:
                base_sql += " AND j.judge ILIKE :judge"
                params["judge"] = f"%{judge}%"
            if law:
                base_sql += " AND (j.title ILIKE :law OR j.sections_referenced ILIKE :law)"
                params["law"] = f"%{_escape_like(law)}%"

            base_sql += " ORDER BY fts_score LIMIT :limit"
            params["limit"] = limit

            result = await db.execute(text(base_sql), params)
            rows = result.all()
            if rows:
                return [_judgment_to_result(row._mapping) for row in rows]
        except Exception:
            pass

    # Fallback: LIKE-based search
    stmt = select(Judgment)
    filters = []
    keyword = _escape_like(classified.normalized_query)

    if classified.search_type == "citation" and classified.citation:
        q_esc = _escape_like(classified.citation)
        filters.append(Judgment.citation.ilike(f"%{q_esc}%"))
    elif classified.search_type == "section" and classified.section:
        q_esc = _escape_like(classified.section)
        parts = q_esc.split()
        reversed_q = " ".join(reversed(parts)) if len(parts) == 2 else q_esc
        filters.append(
            or_(
                Judgment.title.ilike(f"%{q_esc}%"),
                Judgment.title.ilike(f"%{reversed_q}%"),
                Judgment.sections_referenced.ilike(f"%{q_esc}%"),
                Judgment.description.ilike(f"%{q_esc}%"),
            )
        )
    else:
        filters.append(
            or_(
                Judgment.title.ilike(f"%{keyword}%"),
                Judgment.description.ilike(f"%{keyword}%"),
                Judgment.full_text.ilike(f"%{keyword}%"),
                Judgment.citation.ilike(f"%{keyword}%"),
            )
        )

    if court:
        filters.append(Judgment.court.ilike(f"%{court}%"))
    if year:
        filters.append(cast(Judgment.date, String).like(f"{year}%"))
    if judge:
        filters.append(Judgment.judge.ilike(f"%{judge}%"))
    if law:
        filters.append(Judgment.sections_referenced.ilike(f"%{law}%"))

    stmt = stmt.where(and_(*filters)).limit(limit)
    result = await db.execute(stmt)
    judgments = result.scalars().all()
    return [_judgment_to_result(j) for j in judgments]


# Common law abbreviations to full names for search
LAW_ABBREVIATIONS = {
    "PPC": "Pakistan Penal Code",
    "CrPC": "Criminal Procedure Code",
    "CPC": "Code of Civil Procedure",
    "QSO": "Qanun-e-Shahadat Order",
    "EA": "Evidence Act",
    "PECA": "Prevention of Electronic Crimes Act",
    "ATA": "Anti-Terrorism Act",
    "NAB": "National Accountability Bureau",
    "Hudood": "Hudood Ordinance",
    "Muslim Family Law": "Muslim Family Laws Ordinance",
    "Contract Act": "Contract Act",
    "Sale of Goods": "Sale of Goods Act",
    "Limitation": "Limitation Act",
    "Registration": "Registration Act",
    "Stamp": "Stamp Act",
    "Companies": "Companies Act",
    "Banking": "Banking Companies Ordinance",
    "Income Tax": "Income Tax Ordinance",
    "Sales Tax": "Sales Tax Act",
    "Customs": "Customs Act",
    "Excise": "Excise Act",
    "Labour": "Labour Code",
    "Factories": "Factories Act",
    "Shops": "Shops and Establishments",
    "Land Revenue": "Land Revenue Act",
    "Transfer of Property": "Transfer of Property Act",
    "Specific Relief": "Specific Relief Act",
    "Arbitration": "Arbitration Act",
    "Contempt": "Contempt of Court Act",
    "Anti Money Laundering": "Anti Money Laundering Act",
    "Benami": "Benami Transactions Act",
    "Juvenile": "Juvenile Justice System Act",
    "Domestic Violence": "Domestic Violence Act",
    "Women Protection": "Women Protection Act",
    "Dowry": "Dowry and Bridal Gifts Act",
    "Child Marriage": "Child Marriage Restraint Act",
    "Guardian": "Guardian and Wards Act",
    "Succession": "Succession Act",
    "Waqf": "Waqf Properties Ordinance",
    "Evacuee": "Evacuee Trust Properties Act",
    "Enemy Property": "Enemy Property Ordinance",
    "National Registration": "National Database and Registration Authority",
    "Passport": "Passports Act",
    "Citizenship": "Citizenship Act",
    "Emigration": "Emigration Ordinance",
    "Foreigners": "Foreigners Act",
    "Official Secrets": "Official Secrets Act",
    "Pakistan Army": "Pakistan Army Act",
    "Air Force": "Pakistan Air Force Act",
    "Navy": "Pakistan Navy Ordinance",
    "Defence": "Defence of Pakistan Act",
    "Narcotics": "Control of Narcotic Substances Act",
    "Drugs": "Drugs Act",
    "Pharmacy": "Pharmacy Act",
    "Medical": "Medical and Dental Council Act",
    "Health": "Health Care Commission Act",
    "Environment": "Pakistan Environmental Protection Act",
    "Wildlife": "Wildlife Ordinance",
    "Forest": "Forest Act",
    "Fisheries": "Fisheries Act",
    "Mines": "Mines Act",
    "Petroleum": "Petroleum Act",
    "Electricity": "Electricity Act",
    "Telegraph": "Pakistan Telecommunication Act",
    "Railways": "Railways Act",
    "Motor Vehicles": "Motor Vehicles Ordinance",
    "Ports": "Ports Act",
    "Customs Act": "Customs Act",
    "Anti-Dumping": "Anti-Dumping Duties Act",
    "Countervailing": "Countervailing Duties Act",
    "Trade Organizations": "Trade Organizations Act",
    "Competition": "Competition Act",
    "Securities": "Securities and Exchange Commission Act",
    "Insurance": "Insurance Ordinance",
    "Modaraba": "Modaraba Companies and Modaraba Ordinance",
    "Mutual Funds": "Non-Banking Finance Companies Act",
    "Privatization": "Privatization Commission Ordinance",
    "Public Procurement": "Public Procurement Regulatory Authority Act",
    "Right to Information": "Right of Access to Information Act",
    "Ombudsman": "Wafaqi Mohtasib Order",
    "Protection of Pakistan": "Protection of Pakistan Act",
    "Fair Trial": "Fair Trial Act",
    "Anti-Terrorism": "Anti-Terrorism Act",
    "National Internal Security": "National Internal Security Policy",
    "Pakistan Penal Code": "Pakistan Penal Code",
    "Penal Code": "Pakistan Penal Code",
}


async def _search_laws(
    q: str,
    db: AsyncSession,
    law: Optional[str] = None,
    limit: int = 6,
) -> list[UnifiedSearchResult]:
    """Search law sections using FTS5 with LIKE fallback."""
    classified = classifier.classify(q)

    # For section searches, extract section number and resolve law abbreviation
    section_num = None
    law_full_name = None
    if classified.search_type == "section" and classified.section:
        parts = classified.section.strip().split()
        if len(parts) >= 1:
            section_num = parts[0]
        if len(parts) >= 2:
            abbrev = " ".join(parts[1:])
            law_full_name = LAW_ABBREVIATIONS.get(abbrev, LAW_ABBREVIATIONS.get(abbrev.upper()))
            if not law_full_name:
                # Try partial match
                for key, val in LAW_ABBREVIATIONS.items():
                    if key.lower() in abbrev.lower() or abbrev.lower() in key.lower():
                        law_full_name = val
                        break

    # Try FTS5 first
    fts_q = _fts_query(classified.normalized_query)
    if fts_q:
        try:
            base_sql = """
                SELECT l.*, bm25(law_sections_fts, 0, 1.0, 2.0, 3.0) AS fts_score
                FROM law_sections l
                INNER JOIN law_sections_fts ON l.id = law_sections_fts.rowid
                WHERE law_sections_fts MATCH :fts_query
            """
            params: dict = {"fts_query": fts_q}

            if law:
                base_sql += " AND (l.law_name ILIKE :law OR l.section_number ILIKE :law)"
                params["law"] = f"%{_escape_like(law)}%"

            base_sql += " ORDER BY fts_score LIMIT :limit"
            params["limit"] = limit

            result = await db.execute(text(base_sql), params)
            rows = result.all()
            if rows:
                return [_law_to_result(row._mapping) for row in rows]
        except Exception:
            pass

    # Fallback: LIKE-based search
    stmt = select(LawSection)
    filters = []
    keyword = _escape_like(classified.normalized_query)

    if classified.search_type == "section" and section_num:
        # For section searches, use section number + law name
        if law_full_name:
            filters.append(
                and_(
                    LawSection.section_number.ilike(f"%{section_num}%"),
                    LawSection.law_name.ilike(f"%{law_full_name}%"),
                )
            )
        else:
            filters.append(LawSection.section_number.ilike(f"%{section_num}%"))
    else:
        # General keyword search
        filters.append(
            or_(
                LawSection.law_name.ilike(f"%{keyword}%"),
                LawSection.section_number.ilike(f"%{keyword}%"),
                LawSection.section_text.ilike(f"%{keyword}%"),
            )
        )

    if law:
        filters.append(
            or_(
                LawSection.law_name.ilike(f"%{law}%"),
                LawSection.section_number.ilike(f"%{law}%"),
            )
        )

    stmt = stmt.where(and_(*filters)).limit(limit)
    result = await db.execute(stmt)
    laws = result.scalars().all()
    return [_law_to_result(l) for l in laws]


async def _search_magazines(
    q: str,
    db: AsyncSession,
    topic: Optional[str] = None,
    magazine: Optional[str] = None,
    author: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 6,
) -> list[UnifiedSearchResult]:
    """Search magazine articles using LIKE-based search."""
    stmt = select(MagazineArticle)
    filters = []
    keyword = f"%{_escape_like(q)}%"

    filters.append(
        or_(
            MagazineArticle.title.ilike(keyword),
            MagazineArticle.description.ilike(keyword),
            MagazineArticle.author.ilike(keyword),
            MagazineArticle.topic.ilike(keyword),
            MagazineArticle.magazine_name.ilike(keyword),
        )
    )

    if topic:
        filters.append(MagazineArticle.topic.ilike(f"%{topic}%"))
    if magazine:
        filters.append(MagazineArticle.magazine_name.ilike(f"%{magazine}%"))
    if author:
        filters.append(MagazineArticle.author.ilike(f"%{author}%"))
    if year:
        filters.append(MagazineArticle.year == year)

    stmt = stmt.where(and_(*filters)).limit(limit)
    result = await db.execute(stmt)
    articles = result.scalars().all()
    return [_magazine_to_result(a) for a in articles]


# ── Autocomplete Suggestions ──────────────────────────────────


@router.get("/suggestions")
async def unified_suggestions(
    q: str = Query(..., min_length=1, max_length=200),
    db: AsyncSession = Depends(get_db),
):
    """Quick autocomplete suggestions across judgments, laws, and magazines."""
    try:
        if len(q.strip()) < 2:
            return {"suggestions": []}

        keyword = _escape_like(q.strip())
        suggestions = []
        seen = set()

        # 1. Judgment citations
        stmt = select(Judgment.citation, Judgment.title).where(
            or_(
                Judgment.citation.ilike(f"%{keyword}%"),
                Judgment.title.ilike(f"%{keyword}%"),
            )
        ).limit(4)
        result = await db.execute(stmt)
        for row in result:
            text = row[0] or row[1]
            if text and text not in seen:
                seen.add(text)
                suggestions.append({"text": text, "type": "citation", "label": row[1][:60] if row[1] else ""})

        # 2. Law sections
        stmt = select(LawSection.law_name, LawSection.section_number).where(
            or_(
                LawSection.law_name.ilike(f"%{keyword}%"),
                LawSection.section_number.ilike(f"%{keyword}%"),
            )
        ).limit(3)
        result = await db.execute(stmt)
        for row in result:
            text = f"Section {row[1]} - {row[0]}"
            if text not in seen:
                seen.add(text)
                suggestions.append({"text": text, "type": "section", "label": f"{row[0]} §{row[1]}"})

        # 3. Magazine articles
        stmt = select(MagazineArticle.title).where(
            MagazineArticle.title.ilike(f"%{keyword}%")
        ).limit(3)
        result = await db.execute(stmt)
        for row in result:
            text = row[0]
            if text and text not in seen:
                seen.add(text)
                suggestions.append({"text": text, "type": "keyword", "label": ""})

        return {"suggestions": suggestions[:8]}
    except Exception as e:
        logger.warning("Suggestions error for '%s': %s", q, e)
        return {"suggestions": []}


# ── Multi-Source Live Search ────────────────────────────────────

@router.get("/live")
async def live_search(
    q: str = Query(..., min_length=1, max_length=500),
    court: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    sources: Optional[str] = Query(None, description="Comma-separated source keys"),
    db: AsyncSession = Depends(get_db),
):
    """
    Live multi-source search.

    Searches local database AND external court websites in parallel.
    Returns aggregated results with source attribution and status.
    """
    from app.services.multi_source_search import multi_source_search

    # Build filters
    filters = {}
    if court:
        filters["court"] = court
    if year:
        filters["year"] = year

    # Parse source list
    source_keys = None
    if sources:
        source_keys = [s.strip() for s in sources.split(",") if s.strip()]

    # Execute multi-source search
    result = await multi_source_search.search(
        query=q,
        filters=filters,
        sources=source_keys,
        timeout=20.0,
    )

    # Build response
    return {
        "query": result.query,
        "search_type": result.search_type,
        "total": len(result.results),
        "results": [
            {
                "id": f"{r.source_key}_{hash(r.title + r.citation) % 1000000}",
                "title": r.title,
                "subtitle": r.citation,
                "citation": r.citation,
                "court": r.court,
                "date": r.date,
                "case_number": r.case_number,
                "description": r.description,
                "content_snippet": r.content_snippet,
                "source_url": r.source_url,
                "pdf_url": r.pdf_url,
                "source_key": r.source_key,
                "source_name": r.source_name,
                "source": r.source_name,
                "type": r.result_type,
                "score": r.score,
                "sections": r.sections,
                "url": r.source_url or f"/judgment/{r.source_key}",
            }
            for r in result.results
        ],
        "categories": {
            "judgments": len([r for r in result.results if r.result_type == "judgment"]),
            "laws": len([r for r in result.results if r.result_type == "law"]),
        },
        "source_status": result.source_status,
        "citation_info": {
            "year": result.citation_info.year,
            "reporter": result.citation_info.reporter,
            "page": result.citation_info.page,
            "court": result.citation_info.court,
            "confidence": result.citation_info.confidence,
        } if result.citation_info else None,
        "citation_urls": result.citation_urls,
        "search_time_ms": round(result.search_time_ms, 1),
        "sources_checked": result.total_sources_checked,
        "sources_succeeded": result.total_sources_succeeded,
    }


@router.get("/sources")
async def get_sources():
    """Get all registered data sources with their status."""
    from app.services.source_registry import registry

    sources = registry.get_all()
    return {
        "sources": [
            {
                "key": s.key,
                "name": s.name,
                "type": s.source_type.value,
                "status": s.health.status.value,
                "base_url": s.base_url,
                "capabilities": {
                    "judgments": s.capabilities.has_judgments,
                    "laws": s.capabilities.has_laws,
                    "citations": s.capabilities.has_citations,
                    "sections": s.capabilities.has_sections,
                    "pdf": s.capabilities.has_pdf,
                },
                "success_rate": round(s.health.success_rate, 2),
                "avg_response_ms": round(s.health.avg_response_time * 1000, 0),
                "notes": s.notes,
            }
            for s in sources
        ]
    }


@router.get("/sources/health")
async def get_source_health():
    """Get health status of all sources."""
    from app.services.source_registry import registry

    sources = registry.get_all()
    return {
        "health": {
            s.key: {
                "status": s.health.status.value,
                "success_rate": round(s.health.success_rate, 2),
                "total_requests": s.health.total_requests,
                "total_failures": s.health.total_failures,
                "avg_response_ms": round(s.health.avg_response_time * 1000, 0),
            }
            for s in sources
        }
    }
