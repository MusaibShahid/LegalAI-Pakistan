"""API endpoints for PLJ citation search."""
import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/plj", tags=["plj"])

PLJ_BASE_URL = "https://www.pljlawsite.com"
PLJ_CITATION_URL = f"{PLJ_BASE_URL}/citationsearch.asp"

BOOK_OPTIONS = ["PLJ", "CLC", "MLD", "YLR", "PCrLJ", "SCR", "SCMR", "PLD"]
COURT_OPTIONS = [
    "Supreme Court", "Supreme Court (Criminal)", "Lahore High Court",
    "Karachi High Court", "Peshawar High Court", "Quetta High Court",
    "Islamabad High Court", "Tribunal Cases", "AJ&K Court",
    "Tax Cases", "FSC", "Cr.C", "Law Note (Civil)", "Law Note (Criminal)",
]


class PLJCitationRequest(BaseModel):
    book_name: str = "PLJ"
    court_name: str = ""
    year: str = ""
    page_number: str = ""


class PLJCitationResult(BaseModel):
    citation: str = ""
    title: str = ""
    parties: str = ""
    court: str = ""
    year: str = ""
    page_number: str = ""
    judge: str = ""
    source_url: str = ""


class PLJSearchResponse(BaseModel):
    results: list[PLJCitationResult]
    total: int
    source: str = "plj_law_site"
    search_params: dict


@router.get("/books")
async def get_book_options():
    """Get available book names for PLJ citation search."""
    return {"books": BOOK_OPTIONS}


@router.get("/courts")
async def get_court_options():
    """Get available court names for PLJ citation search."""
    return {"courts": COURT_OPTIONS}


@router.post("/search", response_model=PLJSearchResponse)
async def search_plj_citations(request: PLJCitationRequest):
    """
    Search PLJ citation database.

    Note: This endpoint requires PLJ subscription credentials.
    Set PLJ_USERNAME and PLJ_PASSWORD environment variables.

    For now, this returns a structured response that can be
    connected to the PLJ scraper when credentials are available.
    """
    # Check if PLJ credentials are configured
    import os
    username = os.environ.get("PLJ_USERNAME", "")
    password = os.environ.get("PLJ_PASSWORD", "")

    if not username or not password:
        # Return info about how to configure
        return PLJSearchResponse(
            results=[],
            total=0,
            search_params=request.model_dump(),
        )

    # When credentials are available, use the scraper
    try:
        from playwright_crawler.plj_scraper import PLJScraper

        scraper = PLJScraper(username, password)
        await scraper.start()

        try:
            raw_results = await scraper.search_citations(
                book_name=request.book_name,
                court_name=request.court_name,
                year=request.year,
                page_number=request.page_number,
            )

            results = [
                PLJCitationResult(
                    citation=r.citation,
                    title=r.title,
                    parties=r.parties,
                    court=r.court_name,
                    year=r.year,
                    page_number=r.page_number,
                    judge=r.judge,
                    source_url=r.source_url,
                )
                for r in raw_results
            ]

            return PLJSearchResponse(
                results=results,
                total=len(results),
                search_params=request.model_dump(),
            )
        finally:
            await scraper.close()

    except Exception as e:
        logger.exception("PLJ search error")
        raise HTTPException(status_code=500, detail="PLJ search failed. Please try again later.")


@router.get("/search")
async def search_plj_citations_get(
    book: str = "PLJ",
    court: str = "",
    year: str = "",
    page_no: str = "",
):
    """GET endpoint for PLJ citation search (for frontend integration)."""
    request = PLJCitationRequest(
        book_name=book,
        court_name=court,
        year=year,
        page_number=page_no,
    )
    return await search_plj_citations(request)
