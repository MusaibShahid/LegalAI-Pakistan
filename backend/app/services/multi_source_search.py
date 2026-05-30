"""
Multi-Source Search Service for LegalSearch Pakistan.

Orchestrates search across multiple legal data sources in parallel:
1. Local database (fastest - always searched first)
2. Accessible court websites (parallel)
3. Law databases (parallel)
4. Archive fallbacks (if primary sources fail)

Results are aggregated, deduplicated, and ranked.
"""

import asyncio
import hashlib
import json
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Optional

import httpx

from app.core.citation_parser import parse_citation, build_search_urls, ParsedCitation
from app.core.metadata import classify_query
from app.services.source_registry import (
    registry, LegalSource, SourceStatus, SourceType, AccessMethod,
)

logger = logging.getLogger(__name__)


# ── Result Data Classes ────────────────────────────────────────

@dataclass
class SourceResult:
    """A single result from a source."""
    title: str
    citation: str = ""
    court: str = ""
    date: str = ""
    case_number: str = ""
    description: str = ""
    content_snippet: str = ""
    source_url: str = ""
    pdf_url: str = ""
    source_key: str = ""
    source_name: str = ""
    result_type: str = "judgment"  # judgment, law, citation
    score: float = 0.0
    sections: list[str] = field(default_factory=list)


@dataclass
class AggregatedResults:
    """Results aggregated from multiple sources."""
    query: str
    search_type: str
    results: list[SourceResult] = field(default_factory=list)
    source_status: dict[str, str] = field(default_factory=dict)
    citation_info: Optional[ParsedCitation] = None
    citation_urls: list[dict] = field(default_factory=list)
    total_sources_checked: int = 0
    total_sources_succeeded: int = 0
    search_time_ms: float = 0.0


# ── Source Adapters ─────────────────────────────────────────────

async def search_local_db(query: str, search_type: str, filters: dict = None) -> list[SourceResult]:
    """Search the local SQLite database."""
    from app.database import async_session
    from app.models.judgment import Judgment
    from app.models.law import LawSection
    from sqlalchemy import select, or_

    results = []

    async with async_session() as session:
        if search_type in ("citation", "judgment", "case_number", "keyword", "party"):
            # Search judgments
            stmt = select(Judgment)

            if search_type == "citation":
                stmt = stmt.where(Judgment.citation.ilike(f"%{query}%"))
            elif search_type == "case_number":
                stmt = stmt.where(Judgment.case_number.ilike(f"%{query}%"))
            elif search_type == "party":
                stmt = stmt.where(Judgment.title.ilike(f"%{query}%"))
            else:
                # Keyword search - use FTS
                stmt = stmt.where(or_(
                    Judgment.title.ilike(f"%{query}%"),
                    Judgment.description.ilike(f"%{query}%"),
                    Judgment.full_text.ilike(f"%{query}%"),
                ))

            # Apply filters
            if filters:
                if filters.get("court"):
                    stmt = stmt.where(Judgment.court.ilike(f"%{filters['court']}%"))
                if filters.get("year"):
                    stmt = stmt.where(Judgment.date.ilike(f"{filters['year']}%"))

            stmt = stmt.limit(20)

            try:
                result = await session.execute(stmt)
                for j in result.scalars().all():
                    results.append(SourceResult(
                        title=j.title,
                        citation=j.citation or "",
                        court=j.court or "",
                        date=str(j.date) if j.date else "",
                        case_number=j.case_number or "",
                        description=j.description or "",
                        content_snippet=(j.full_text or "")[:300],
                        source_url=j.source_url or "",
                        pdf_url=j.pdf_url or "",
                        source_key="local_db",
                        source_name="Local Database",
                        result_type="judgment",
                        sections=_parse_sections(j.sections_referenced),
                    ))
            except Exception as e:
                logger.error(f"Local DB judgment search error: {e}")

        if search_type in ("section", "law", "keyword"):
            # Search law sections
            stmt = select(LawSection)

            if search_type == "section":
                stmt = stmt.where(or_(
                    LawSection.section_number.ilike(f"%{query}%"),
                    LawSection.section_text.ilike(f"%{query}%"),
                ))
            elif search_type == "law":
                stmt = stmt.where(or_(
                    LawSection.law_name.ilike(f"%{query}%"),
                    LawSection.section_text.ilike(f"%{query}%"),
                ))
            else:
                stmt = stmt.where(LawSection.section_text.ilike(f"%{query}%"))

            stmt = stmt.limit(20)

            try:
                result = await session.execute(stmt)
                for ls in result.scalars().all():
                    results.append(SourceResult(
                        title=f"{ls.law_name} - {ls.section_number}",
                        citation=ls.section_number or "",
                        court="Pakistan Code",
                        description=ls.section_text[:200] if ls.section_text else "",
                        content_snippet=ls.section_text[:300] if ls.section_text else "",
                        source_url=ls.source_url or "",
                        source_key="local_db",
                        source_name="Local Database",
                        result_type="law",
                    ))
            except Exception as e:
                logger.error(f"Local DB law search error: {e}")

    return results


async def search_lhc(query: str, search_type: str) -> list[SourceResult]:
    """Search Lahore High Court data portal."""
    results = []

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # LHC has a reported judgments portal
            resp = await client.get(
                "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"},
            )

            if resp.status_code == 200:
                # Parse the page for judgment entries
                html = resp.text
                # Extract judgment entries from the page
                entries = re.findall(
                    r'<tr[^>]*>.*?<td[^>]*>(.*?)</td>.*?<td[^>]*>(.*?)</td>.*?<td[^>]*>(.*?)</td>.*?</tr>',
                    html, re.DOTALL
                )

                for entry in entries[:10]:
                    title = re.sub(r'<[^>]+>', '', entry[0]).strip()
                    citation = re.sub(r'<[^>]+>', '', entry[1]).strip()

                    if query.lower() in title.lower() or query.lower() in citation.lower():
                        results.append(SourceResult(
                            title=title,
                            citation=citation,
                            court="Lahore High Court",
                            source_url="https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
                            source_key="lhc",
                            source_name="Lahore High Court",
                            result_type="judgment",
                        ))

                registry.update_health("lhc", True)
            else:
                registry.update_health("lhc", False)

    except Exception as e:
        logger.error(f"LHC search error: {e}")
        registry.update_health("lhc", False)

    return results


async def search_ihc(query: str, search_type: str) -> list[SourceResult]:
    """Search Islamabad High Court."""
    results = []

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://ihc.gov.pk/Judgments",
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"},
            )

            if resp.status_code == 200:
                registry.update_health("ihc", True)
                # Parse judgments from page
                html = resp.text
                entries = re.findall(
                    r'<div[^>]*class="[^"]*judgment[^"]*"[^>]*>(.*?)</div>',
                    html, re.DOTALL | re.IGNORECASE
                )

                for entry in entries[:10]:
                    text = re.sub(r'<[^>]+>', ' ', entry).strip()
                    if query.lower() in text.lower():
                        results.append(SourceResult(
                            title=text[:100],
                            court="Islamabad High Court",
                            source_url="https://ihc.gov.pk/Judgments",
                            source_key="ihc",
                            source_name="Islamabad High Court",
                            result_type="judgment",
                        ))
            else:
                registry.update_health("ihc", False)

    except Exception as e:
        logger.error(f"IHC search error: {e}")
        registry.update_health("ihc", False)

    return results


async def search_pakistancode(query: str, search_type: str) -> list[SourceResult]:
    """Search Pakistan Code for laws."""
    results = []

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://pakistancode.gov.pk/english/search",
                params={"q": query},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"},
            )

            if resp.status_code == 200:
                registry.update_health("pakistancode", True)
                html = resp.text

                # Parse law entries
                entries = re.findall(
                    r'<div[^>]*class="[^"]*law[^"]*"[^>]*>(.*?)</div>',
                    html, re.DOTALL | re.IGNORECASE
                )

                for entry in entries[:10]:
                    text = re.sub(r'<[^>]+>', ' ', entry).strip()
                    if query.lower() in text.lower():
                        results.append(SourceResult(
                            title=text[:100],
                            court="Pakistan Code",
                            source_url="https://pakistancode.gov.pk",
                            source_key="pakistancode",
                            source_name="Pakistan Code",
                            result_type="law",
                        ))
            else:
                registry.update_health("pakistancode", False)

    except Exception as e:
        logger.error(f"Pakistan Code search error: {e}")
        registry.update_health("pakistancode", False)

    return results


async def search_google_scholar(query: str, search_type: str) -> list[SourceResult]:
    """Search Google Scholar for case law."""
    results = []

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://scholar.google.com/scholar",
                params={"q": query, "as_sdt": "0,5", "hl": "en"},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"},
            )

            if resp.status_code == 200:
                registry.update_health("google_scholar", True)
                html = resp.text

                # Parse scholar results
                blocks = re.findall(
                    r'<div class="gs_r gs_or gs_scl">(.*?)</div>\s*(?:<div class="gs_r|$)',
                    html, re.DOTALL
                )

                for block in blocks[:10]:
                    title_match = re.search(r'<h3[^>]*>(.*?)</h3>', block, re.DOTALL)
                    link_match = re.search(r'href="(https?://[^"]+)"', block)
                    snippet_match = re.search(r'<div class="gs_rs">(.*?)</div>', block, re.DOTALL)

                    if title_match and link_match:
                        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                        snippet = re.sub(r'<[^>]+>', '', snippet_match.group(1)).strip() if snippet_match else ""

                        results.append(SourceResult(
                            title=title[:150],
                            description=snippet[:200],
                            source_url=link_match.group(1),
                            source_key="google_scholar",
                            source_name="Google Scholar",
                            result_type="judgment",
                        ))
            else:
                registry.update_health("google_scholar", False)

    except Exception as e:
        logger.error(f"Google Scholar search error: {e}")
        registry.update_health("google_scholar", False)

    return results


async def search_wayback(url: str) -> Optional[str]:
    """Try to fetch a URL from Wayback Machine."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"https://archive.org/wayback/available?url={url}"
            )
            if resp.status_code == 200:
                data = resp.json()
                snapshot = data.get("archived_snapshots", {}).get("closest", {})
                if snapshot.get("available"):
                    page_resp = await client.get(snapshot["url"], timeout=30.0, follow_redirects=True)
                    if page_resp.status_code == 200:
                        return page_resp.text
    except Exception as e:
        logger.error(f"Wayback search error: {e}")
    return None


# ── Helper Functions ────────────────────────────────────────────

def _parse_sections(sections_json: str) -> list[str]:
    """Parse sections JSON string."""
    if not sections_json:
        return []
    try:
        sections = json.loads(sections_json)
        return sections if isinstance(sections, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _deduplicate_results(results: list[SourceResult]) -> list[SourceResult]:
    """Remove duplicate results based on title + citation."""
    seen = set()
    deduped = []

    for r in results:
        # Create a key from title + citation
        key = hashlib.md5(f"{r.title.lower().strip()}:{r.citation.lower().strip()}".encode()).hexdigest()
        if key not in seen:
            seen.add(key)
            deduped.append(r)

    return deduped


def _rank_results(results: list[SourceResult], query: str, search_type: str) -> list[SourceResult]:
    """Rank results by relevance."""
    query_lower = query.lower()

    for r in results:
        score = 0.0

        # Exact citation match = highest score
        if search_type == "citation" and r.citation:
            if query_lower in r.citation.lower():
                score += 100.0

        # Exact section match
        if search_type == "section" and r.citation:
            if query_lower in r.citation.lower():
                score += 90.0

        # Title match
        if query_lower in r.title.lower():
            score += 50.0

        # Description match
        if query_lower in r.description.lower():
            score += 20.0

        # Content match
        if query_lower in r.content_snippet.lower():
            score += 10.0

        # Source priority boost
        if r.source_key == "local_db":
            score += 5.0
        elif r.source_key in ("lhc", "ihc", "fsc"):
            score += 3.0

        # Exact match boost
        if query_lower == r.title.lower():
            score += 200.0

        r.score = score

    # Sort by score descending
    results.sort(key=lambda r: r.score, reverse=True)
    return results


# ── Main Search Orchestrator ────────────────────────────────────

class MultiSourceSearchService:
    """Orchestrates search across multiple legal data sources."""

    def __init__(self):
        self.registry = registry

    async def search(
        self,
        query: str,
        filters: dict = None,
        sources: list[str] = None,
        timeout: float = 30.0,
    ) -> AggregatedResults:
        """
        Search across all available sources in parallel.

        Args:
            query: The search query
            filters: Optional filters (court, year, etc.)
            sources: Optional list of source keys to search (None = all)
            timeout: Max time to wait for all sources

        Returns:
            AggregatedResults with merged and ranked results
        """
        start_time = time.time()

        # Classify the query
        search_type = classify_query(query)

        # Parse citation if applicable
        citation_info = None
        citation_urls = []
        if search_type == "citation":
            citation_info = parse_citation(query)
            if citation_info:
                citation_urls = build_search_urls(citation_info)

        # Determine which sources to search
        if sources:
            active_sources = [self.registry.get(s) for s in sources if self.registry.get(s)]
            active_sources = [s for s in active_sources if s]
        else:
            active_sources = self.registry.get_for_search_type(search_type)

        # Build search tasks with source keys
        task_pairs = []  # (source_key, coroutine) pairs

        # Always search local DB first
        task_pairs.append(("local_db", search_local_db(query, search_type, filters)))

        # Add external source searches
        for source in active_sources:
            if source.key == "local_db":
                continue  # Already added

            if source.health.status == SourceStatus.DOWN:
                continue  # Skip down sources

            if source.key == "lhc":
                task_pairs.append(("lhc", search_lhc(query, search_type)))
            elif source.key == "ihc":
                task_pairs.append(("ihc", search_ihc(query, search_type)))
            elif source.key == "pakistancode":
                task_pairs.append(("pakistancode", search_pakistancode(query, search_type)))
            elif source.key == "google_scholar":
                task_pairs.append(("google_scholar", search_google_scholar(query, search_type)))

        # Execute all searches in parallel with timeout
        all_results = []
        source_status = {}
        total_succeeded = 0

        # Create tasks with proper tracking
        source_keys = [k for k, _ in task_pairs]
        created_tasks = [asyncio.create_task(coro) for _, coro in task_pairs]

        try:
            done, pending = await asyncio.wait(
                created_tasks,
                timeout=timeout,
                return_when=asyncio.ALL_COMPLETED,
            )

            for i, task in enumerate(created_tasks):
                if task.done() and not task.cancelled():
                    try:
                        results = task.result()
                        key = source_keys[i]
                        source_status[key] = "ok" if results else "no_results"
                        if results:
                            total_succeeded += 1
                            all_results.extend(results)
                    except Exception as e:
                        logger.error(f"Source {source_keys[i]} error: {e}")
                        source_status[source_keys[i]] = f"error: {str(e)[:50]}"

            # Cancel pending tasks
            for task in pending:
                task.cancel()

        except asyncio.TimeoutError:
            logger.warning(f"Search timed out after {timeout}s")

        # Deduplicate
        all_results = _deduplicate_results(all_results)

        # Rank
        all_results = _rank_results(all_results, query, search_type)

        search_time = (time.time() - start_time) * 1000

        return AggregatedResults(
            query=query,
            search_type=search_type,
            results=all_results,
            source_status=source_status,
            citation_info=citation_info,
            citation_urls=citation_urls,
            total_sources_checked=len(task_pairs),
            total_sources_succeeded=total_succeeded,
            search_time_ms=search_time,
        )


# Global service instance
multi_source_search = MultiSourceSearchService()
