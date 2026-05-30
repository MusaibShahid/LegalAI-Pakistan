from typing import Optional
from pydantic import BaseModel, ConfigDict


class MagazineArticleBase(BaseModel):
    title: str
    magazine_name: str
    volume: Optional[str] = None
    issue: Optional[str] = None
    year: Optional[int] = None
    author: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    page_numbers: Optional[str] = None
    source_url: Optional[str] = None


class MagazineArticle(MagazineArticleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str


class MagazineSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    magazine_name: str
    year: Optional[int] = None
    author: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    source_url: Optional[str] = None


class MagazineSearchResponse(BaseModel):
    results: list[MagazineSearchResult]
    total: int
    query: str
    page: int = 1
    page_size: int = 20
