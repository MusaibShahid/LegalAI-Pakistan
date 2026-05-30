import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.magazine import MagazineArticle
from app.schemas.magazine import MagazineSearchResponse, MagazineSearchResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/magazines", tags=["magazines"])


@router.get("/search", response_model=MagazineSearchResponse)
async def search_magazines(
    q: str = Query(..., min_length=1, max_length=500),
    magazine_name: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    author: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search magazine articles."""
    try:
        stmt = select(MagazineArticle)
        filters = []

        keyword = f"%{q}%"
        filters.append(
            or_(
                MagazineArticle.title.ilike(keyword),
                MagazineArticle.description.ilike(keyword),
                MagazineArticle.author.ilike(keyword),
                MagazineArticle.topic.ilike(keyword),
                MagazineArticle.magazine_name.ilike(keyword),
            )
        )

        if magazine_name:
            filters.append(MagazineArticle.magazine_name.ilike(f"%{magazine_name}%"))
        if year:
            filters.append(MagazineArticle.year == year)
        if author:
            filters.append(MagazineArticle.author.ilike(f"%{author}%"))
        if topic:
            filters.append(MagazineArticle.topic.ilike(f"%{topic}%"))

        stmt = stmt.where(and_(*filters))
        
        # Get total count
        count_stmt = select(MagazineArticle.id).where(and_(*filters))
        total_result = await db.execute(count_stmt)
        total = len(total_result.all())

        # Paginate
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        articles = result.scalars().all()

        return MagazineSearchResponse(
            results=[
                MagazineSearchResult(
                    id=str(a.id),
                    title=a.title,
                    magazine_name=a.magazine_name,
                    year=a.year,
                    author=a.author,
                    topic=a.topic,
                    description=a.description,
                    volume=a.volume,
                    issue=a.issue,
                    source_url=a.source_url,
                )
                for a in articles
            ],
            total=total,
            query=q,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        logger.exception("Magazine search error")
        return MagazineSearchResponse(results=[], total=0, query=q, page=page, page_size=page_size)


@router.get("/", response_model=MagazineSearchResponse)
async def list_magazines(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all magazine articles with pagination."""
    try:
        count_stmt = select(MagazineArticle.id)
        total_result = await db.execute(count_stmt)
        total = len(total_result.all())

        stmt = select(MagazineArticle).order_by(MagazineArticle.year.desc().nullslast()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        articles = result.scalars().all()

        return MagazineSearchResponse(
            results=[
                MagazineSearchResult(
                    id=str(a.id),
                    title=a.title,
                    magazine_name=a.magazine_name,
                    year=a.year,
                    author=a.author,
                    topic=a.topic,
                    description=a.description,
                    volume=a.volume,
                    issue=a.issue,
                    source_url=a.source_url,
                )
                for a in articles
            ],
            total=total,
            query="",
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        logger.exception("Magazine list error")
        return MagazineSearchResponse(results=[], total=0, query="", page=page, page_size=page_size)


@router.get("/magazines-list", response_model=list[str])
async def get_magazine_names(db: AsyncSession = Depends(get_db)):
    """Get distinct magazine names for filtering."""
    try:
        stmt = select(MagazineArticle.magazine_name).distinct().order_by(MagazineArticle.magazine_name)
        result = await db.execute(stmt)
        return [row[0] for row in result if row[0]]
    except Exception:
        return []
