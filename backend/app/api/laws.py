import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.law import LawSection
from app.schemas.judgment import LawSectionResponse

router = APIRouter(prefix="/api", tags=["laws"])


@router.get("/laws/{law_id}", response_model=LawSectionResponse)
async def get_law_section(
    law_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific law section by ID."""
    try:
        lid = int(law_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid law ID")

    stmt = select(LawSection).where(LawSection.id == lid)
    result = await db.execute(stmt)
    law = result.scalar_one_or_none()

    if not law:
        raise HTTPException(status_code=404, detail="Law section not found")

    return LawSectionResponse(
        id=str(law.id),
        law_name=law.law_name,
        section_number=law.section_number,
        section_text=law.section_text,
        related_sections=json.loads(law.related_sections) if law.related_sections else [],
        related_judgments=json.loads(law.related_judgments) if law.related_judgments else [],
        source_url=law.source_url,
    )
