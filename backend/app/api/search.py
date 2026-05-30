import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.search import SearchResponse, SearchSuggestion
from app.services.search_service import search_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def search_endpoint(
    q: str = Query(..., min_length=1, max_length=500),
    court: str | None = Query(None),
    judge: str | None = Query(None),
    year: int | None = Query(None),
    jurisdiction: str | None = Query(None),
    law: str | None = Query(None),
    subject: str | None = Query(None),
    case_type: str | None = Query(None),
    court_level: str | None = Query(None),
    search_type: str | None = Query(None, description="Filter by type: 'judgment' or 'law'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Universal search endpoint for legal queries."""
    try:
        return await search_service.search(
            query=q,
            db=db,
            court=court,
            judge=judge,
            year=year,
            law=law,
            jurisdiction=jurisdiction,
            subject=subject,
            case_type=case_type,
            court_level=court_level,
            search_type=search_type,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Search error for query: %s", q)
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")


@router.get("/suggestions", response_model=list[SearchSuggestion])
async def suggestions_endpoint(
    q: str = Query(..., min_length=1, max_length=200),
    db: AsyncSession = Depends(get_db),
):
    """Get search suggestions for autocomplete."""
    try:
        return await search_service.get_suggestions(query=q, db=db)
    except Exception as e:
        logger.warning("Suggestions error: %s", e)
        return []
