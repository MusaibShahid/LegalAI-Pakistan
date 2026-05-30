from sqlalchemy import Column, Integer, String, Text, Date, JSON, DateTime, func
from app.database import Base


class Judgment(Base):
    __tablename__ = "judgments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(1000), nullable=False)
    citation = Column(String(255), nullable=False, index=True)
    court = Column(String(255), nullable=False, index=True)
    bench = Column(String(500), nullable=True)
    judge = Column(String(500), nullable=True)
    date = Column(Date, nullable=True, index=True)
    case_number = Column(String(255), nullable=True)
    sections_referenced = Column(Text, default="[]")
    full_text = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    source_url = Column(String(2000), nullable=False)
    pdf_url = Column(String(2000), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Judgment(id={self.id}, citation={self.citation}, court={self.court})>"
