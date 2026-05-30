from typing import Optional
from pydantic import BaseModel, ConfigDict


class LimitationInfo(BaseModel):
    """Information about a limitation period under the Limitation Act 1908."""
    article: str
    description: str
    period: str
    time_start: str
    notes: Optional[str] = None


class CourtFeeInfo(BaseModel):
    """Information about court fees for various legal proceedings."""
    proceeding: str
    fee_type: str
    fee_description: str
    estimated_fee: str
    notes: Optional[str] = None


class ProcedureStep(BaseModel):
    """A step in a legal procedure."""
    step_number: int
    title: str
    description: str
    estimated_time: Optional[str] = None
    documents_required: list[str] = []
    tips: Optional[str] = None


class LegalProcedure(BaseModel):
    """A complete legal procedure guide."""
    id: str
    title: str
    category: str
    overview: str
    applicable_laws: list[str] = []
    jurisdiction: str = "Pakistan"
    steps: list[ProcedureStep] = []
    notes: Optional[str] = None


class ProcedureCategory(BaseModel):
    """A category of legal procedures."""
    id: str
    name: str
    description: str
    icon: Optional[str] = None
    procedures: list[LegalProcedure] = []


class LegalToolkit(BaseModel):
    """Collection of all legal tools and resources."""
    limitation_periods: list[LimitationInfo] = []
    court_fees: list[CourtFeeInfo] = []
    procedures: list[ProcedureCategory] = []


class BailInfo(BaseModel):
    """Information about bail provisions."""
    section: str
    offense_type: str
    bailable: bool
    conditions: str
    court: str
    notes: Optional[str] = None
