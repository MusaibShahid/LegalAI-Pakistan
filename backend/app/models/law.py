from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.database import Base


class LawSection(Base):
    __tablename__ = "law_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(255), unique=True, nullable=False, index=True)
    law_name = Column(String(500), nullable=False, index=True)
    section_number = Column(String(50), nullable=False, index=True)
    section_text = Column(Text, nullable=False)
    related_sections = Column(Text, default="[]")
    related_judgments = Column(Text, default="[]")
    source_url = Column(String(2000), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    def __repr__(self):
        return f"<LawSection(id={self.id}, law={self.law_name}, section={self.section_number})>"
