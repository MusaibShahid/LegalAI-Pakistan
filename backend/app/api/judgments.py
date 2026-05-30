import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlparse

from app.database import get_db
from app.models.judgment import Judgment
from app.schemas.judgment import JudgmentResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["judgments"])

ALLOWED_PDF_DOMAINS = [
    "supremecourt.gov.pk",
    "scp.gov.pk",
    "lhc.gov.pk",
    "data.lhc.gov.pk",
    "shc.gov.pk",
    "caselaw.shc.gov.pk",
    "pakistancode.gov.pk",
    "ihc.gov.pk",
    "phc.gov.pk",
    "bhc.gov.pk",
]


# IMPORTANT: /latest MUST come before /{judgment_id} to avoid route conflict
@router.get("/judgments/latest")
async def get_latest_judgments(
    limit: int = 10,
    court: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get the most recently added judgments."""
    stmt = select(Judgment).order_by(desc(Judgment.date), desc(Judgment.id))

    if court:
        stmt = stmt.where(Judgment.court.ilike(f"%{court}%"))

    stmt = stmt.limit(min(limit, 50))

    result = await db.execute(stmt)
    judgments = result.scalars().all()

    return [
        {
            "id": str(j.id),
            "title": j.title,
            "citation": j.citation,
            "court": j.court,
            "judge": j.judge,
            "date": str(j.date) if j.date else "",
            "case_number": j.case_number,
            "sections": json.loads(j.sections_referenced) if j.sections_referenced else [],
            "description": j.description or "",
            "source_url": j.source_url,
            "pdf_url": j.pdf_url,
        }
        for j in judgments
    ]


async def _get_judgment_or_404(judgment_id: str, db: AsyncSession) -> Judgment:
    try:
        jid = int(judgment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid judgment ID")

    stmt = select(Judgment).where(Judgment.id == jid)
    result = await db.execute(stmt)
    judgment = result.scalar_one_or_none()

    if not judgment:
        raise HTTPException(status_code=404, detail="Judgment not found")

    return judgment


@router.get("/judgments/{judgment_id}", response_model=JudgmentResponse)
async def get_judgment(
    judgment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific judgment by ID."""
    judgment = await _get_judgment_or_404(judgment_id, db)

    return JudgmentResponse(
        id=str(judgment.id),
        title=judgment.title,
        citation=judgment.citation,
        court=judgment.court,
        bench=judgment.bench,
        judge=judgment.judge,
        date=str(judgment.date) if judgment.date else "",
        case_number=judgment.case_number,
        sections=json.loads(judgment.sections_referenced) if judgment.sections_referenced else [],
        full_text=judgment.full_text or "",
        source_url=judgment.source_url,
        pdf_url=judgment.pdf_url,
    )


@router.get("/judgments/{judgment_id}/pdf")
async def download_judgment_pdf(
    judgment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Download the PDF for a judgment. Redirects to the external PDF URL."""
    judgment = await _get_judgment_or_404(judgment_id, db)

    if not judgment.pdf_url:
        raise HTTPException(status_code=404, detail="No PDF available for this judgment")

    parsed_url = urlparse(judgment.pdf_url)
    hostname = parsed_url.hostname or ""
    if not any(d in hostname for d in ALLOWED_PDF_DOMAINS):
        logger.warning("Blocked redirect to untrusted domain: %s", hostname)
        raise HTTPException(status_code=400, detail="PDF URL is not from a trusted source")

    return RedirectResponse(url=judgment.pdf_url)
