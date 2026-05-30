from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.database import Base
from datetime import datetime


class SearchCache(Base):
    __tablename__ = "search_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query_hash = Column(String(64), unique=True, nullable=False, index=True)
    query_text = Column(String(1000), nullable=False)
    search_type = Column(String(50), nullable=False)
    results_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
