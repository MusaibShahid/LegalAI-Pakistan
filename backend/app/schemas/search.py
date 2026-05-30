from typing import Optional
from pydantic import BaseModel, ConfigDict


class SearchQuery(BaseModel):
    q: str
    court: Optional[str] = None
    judge: Optional[str] = None
    year: Optional[int] = None
    jurisdiction: Optional[str] = None
    law: Optional[str] = None
    subject: Optional[str] = None
    case_type: Optional[str] = None
    court_level: Optional[str] = None
    page: int = 1
    page_size: int = 20


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    citation: str
    court: str
    date: str
    sections: list[str] = []
    description: str
    content_snippet: Optional[str] = None
    source_url: str
    pdf_url: Optional[str] = None
    score: float = 0.0
    type: str = "judgment"


class SearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    results: list[SearchResultItem]
    total: int
    query: str
    search_type: str = "keyword"
    filters: Optional[dict] = None
    page: int = 1
    page_size: int = 20


class SearchSuggestion(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    text: str
    type: str = "keyword"
