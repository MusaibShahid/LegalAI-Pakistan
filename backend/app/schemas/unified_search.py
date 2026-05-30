from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict


class UnifiedSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    subtitle: str = ""
    description: str = ""
    content_snippet: Optional[str] = None
    type: Literal["judgment", "law", "magazine"]
    source: str = ""
    url: str = ""
    score: float = 0.0
    date: str = ""
    pdf_url: Optional[str] = None
    source_url: Optional[str] = None


class CategoryCounts(BaseModel):
    judgments: int = 0
    laws: int = 0
    magazines: int = 0


class CitationUrl(BaseModel):
    source: str = ""
    url: str = ""
    search_type: str = ""
    description: str = ""


class CitationParsedInfo(BaseModel):
    year: str = ""
    reporter: str = ""
    reporter_full_name: str = ""
    page: str = ""
    court: str = ""
    raw: str = ""
    confidence: float = 0.0
    search_urls: list[CitationUrl] = []


class UnifiedSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    results: list[UnifiedSearchResult]
    categories: CategoryCounts
    total: int
    query: str
    page: int = 1
    page_size: int = 20
    citation_info: Optional[CitationParsedInfo] = None
