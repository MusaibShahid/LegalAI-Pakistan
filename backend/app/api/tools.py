"""API endpoints for free legal tools and resources."""
import logging
from fastapi import APIRouter, HTTPException

from app.schemas.tools import LegalToolkit, BailInfo, LegalProcedure, ProcedureCategory
from app.services.tools_service import (
    get_toolkit,
    get_bail_info,
    get_procedure,
    get_category,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("/toolkit", response_model=LegalToolkit)
async def get_legal_toolkit():
    """Get the complete legal toolkit including limitation periods, court fees, and procedures."""
    return get_toolkit()


@router.get("/limitation-periods")
async def get_limitation_periods():
    """Get all limitation periods under the Limitation Act 1908."""
    return get_toolkit().limitation_periods


@router.get("/court-fees")
async def get_court_fees():
    """Get court fee information for various legal proceedings."""
    return get_toolkit().court_fees


@router.get("/procedures")
async def get_procedures():
    """Get all legal procedure categories and their procedures."""
    return get_toolkit().procedures


@router.get("/procedures/{procedure_id}", response_model=LegalProcedure)
async def get_procedure_by_id(procedure_id: str):
    """Get a specific legal procedure by ID."""
    procedure = get_procedure(procedure_id)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return procedure


@router.get("/categories/{category_id}", response_model=ProcedureCategory)
async def get_category_by_id(category_id: str):
    """Get a specific procedure category by ID."""
    category = get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/bail", response_model=list[BailInfo])
async def get_bail_information():
    """Get information about bail provisions in Pakistani criminal law."""
    return get_bail_info()
