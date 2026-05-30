"""API endpoints for free citation search across multiple sources."""
import logging
from pydantic import BaseModel
from fastapi import APIRouter, Query

from app.core.citation_parser import (
    parse_citation,
    extract_citations,
    build_search_urls,
    REPORTERS,
    ParsedCitation,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/citations", tags=["citations"])


class CitationParseRequest(BaseModel):
    text: str


class ParsedCitationResponse(BaseModel):
    year: str
    reporter: str
    page: str
    court: str
    raw: str
    confidence: float
    search_urls: list[dict]


class CitationSearchResponse(BaseModel):
    query: str
    parsed: ParsedCitationResponse | None
    citations_found: list[ParsedCitationResponse]
    sources: list[dict]
    message: str = ""


@router.get("/reporters")
async def get_reporters():
    """Get list of all known Pakistani law reporters."""
    return {
        "reporters": [
            {
                "code": code,
                "full_name": info["full_name"],
                "court": info["court"],
            }
            for code, info in REPORTERS.items()
        ]
    }


@router.post("/parse", response_model=CitationSearchResponse)
async def parse_and_search(request: CitationParseRequest):
    """
    Parse a citation and provide search URLs for free sources.
    
    Example inputs:
    - "2006 SCMR 109"
    - "PLD 2023 SC 1"
    - "489-F PPC" (section search, not citation)
    """
    text = request.text.strip()
    
    # Try to parse as citation
    parsed = parse_citation(text)
    citations = extract_citations(text)
    
    if parsed:
        search_urls = build_search_urls(parsed)
        parsed_response = ParsedCitationResponse(
            year=parsed.year,
            reporter=parsed.reporter,
            page=parsed.page,
            court=parsed.court,
            raw=parsed.raw,
            confidence=parsed.confidence,
            search_urls=search_urls,
        )
        
        all_citations = [
            ParsedCitationResponse(
                year=c.year,
                reporter=c.reporter,
                page=c.page,
                court=c.court,
                raw=c.raw,
                confidence=c.confidence,
                search_urls=build_search_urls(c),
            )
            for c in citations
        ]
        
        return CitationSearchResponse(
            query=text,
            parsed=parsed_response,
            citations_found=all_citations,
            sources=search_urls,
            message=f"Citation parsed: {parsed.reporter} {parsed.year} page {parsed.page}. Click any source link to search.",
        )
    
    elif citations:
        all_citations = [
            ParsedCitationResponse(
                year=c.year,
                reporter=c.reporter,
                page=c.page,
                court=c.court,
                raw=c.raw,
                confidence=c.confidence,
                search_urls=build_search_urls(c),
            )
            for c in citations
        ]
        
        return CitationSearchResponse(
            query=text,
            parsed=None,
            citations_found=all_citations,
            sources=[],
            message=f"Found {len(citations)} citation(s) in text.",
        )
    
    else:
        # Not a citation - suggest it's a keyword/section search
        return CitationSearchResponse(
            query=text,
            parsed=None,
            citations_found=[],
            sources=[],
            message="No citation pattern detected. This appears to be a keyword or section search.",
        )


@router.get("/search")
async def search_citation(
    q: str = Query(..., min_length=1, max_length=500, description="Citation to search (e.g., '2006 SCMR 109')"),
):
    """
    Search for a citation across free sources.
    
    Returns parsed citation info and links to free sources.
    """
    parsed = parse_citation(q)
    
    if parsed:
        search_urls = build_search_urls(parsed)
        return {
            "query": q,
            "parsed": {
                "year": parsed.year,
                "reporter": parsed.reporter,
                "page": parsed.page,
                "court": parsed.court,
                "confidence": parsed.confidence,
            },
            "sources": search_urls,
            "message": f"Found {parsed.reporter} citation. {len(search_urls)} free sources available.",
        }
    
    return {
        "query": q,
        "parsed": None,
        "sources": [],
        "message": "Could not parse as a citation. Try format like '2006 SCMR 109'.",
    }
