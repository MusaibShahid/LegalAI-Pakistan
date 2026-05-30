from typing import Optional
from pydantic import BaseModel, ConfigDict


class JudgmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    citation: str
    court: str
    bench: Optional[str] = None
    judge: Optional[str] = None
    date: str
    case_number: Optional[str] = None
    sections: list[str] = []
    full_text: str
    source_url: str
    pdf_url: Optional[str] = None


class LawSectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    law_name: str
    section_number: str
    section_text: str
    related_sections: list[str] = []
    related_judgments: list[str] = []
    source_url: str
