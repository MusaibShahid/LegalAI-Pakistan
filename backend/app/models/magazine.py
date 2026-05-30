from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class MagazineArticle(Base):
    __tablename__ = "magazine_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    magazine_name = Column(String(200), nullable=False, index=True)
    volume = Column(String(50), nullable=True)
    issue = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True, index=True)
    author = Column(String(300), nullable=True, index=True)
    topic = Column(String(300), nullable=True, index=True)
    description = Column(Text, nullable=True)
    page_numbers = Column(String(50), nullable=True)
    source_url = Column(String(2000), nullable=True)
