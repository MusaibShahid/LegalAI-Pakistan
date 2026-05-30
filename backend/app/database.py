from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database: create tables + FTS5 virtual tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(create_fts_tables)


def create_fts_tables(conn):
    """Create FTS5 virtual tables for full-text search if not already created.

    We use raw SQL because SQLAlchemy does not natively support FTS5 virtual tables.
    The FTS tables are created as 'external content' tables that reference the
    original tables, so data stays in sync automatically.
    """
    # Check if FTS tables already exist
    result = conn.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name='judgments_fts'")
    )
    if result.fetchone():
        return  # Already created

    # Create FTS5 table for judgments
    conn.execute(
        text("""CREATE VIRTUAL TABLE judgments_fts USING fts5(
            title,
            citation,
            description,
            full_text,
            case_number,
            court,
            judge,
            bench,
            content='judgments',
            content_rowid='id',
            tokenize='porter unicode61'
        )""")
    )

    # Create FTS5 table for law sections
    conn.execute(
        text("""CREATE VIRTUAL TABLE law_sections_fts USING fts5(
            law_name,
            section_number,
            section_text,
            content='law_sections',
            content_rowid='id',
            tokenize='porter unicode61'
        )""")
    )

    # Create triggers to keep FTS tables in sync with judgments
    conn.execute(
        text("""CREATE TRIGGER judgments_ai AFTER INSERT ON judgments BEGIN
            INSERT INTO judgments_fts(rowid, title, citation, description, full_text, case_number, court, judge, bench)
            VALUES (new.id, new.title, new.citation, new.description, new.full_text, new.case_number, new.court, new.judge, new.bench);
        END""")
    )
    conn.execute(
        text("""CREATE TRIGGER judgments_ad AFTER DELETE ON judgments BEGIN
            INSERT INTO judgments_fts(judgments_fts, rowid, title, citation, description, full_text, case_number, court, judge, bench)
            VALUES ('delete', old.id, old.title, old.citation, old.description, old.full_text, old.case_number, old.court, old.judge, old.bench);
        END""")
    )
    conn.execute(
        text("""CREATE TRIGGER judgments_au AFTER UPDATE ON judgments BEGIN
            INSERT INTO judgments_fts(judgments_fts, rowid, title, citation, description, full_text, case_number, court, judge, bench)
            VALUES ('delete', old.id, old.title, old.citation, old.description, old.full_text, old.case_number, old.court, old.judge, old.bench);
            INSERT INTO judgments_fts(rowid, title, citation, description, full_text, case_number, court, judge, bench)
            VALUES (new.id, new.title, new.citation, new.description, new.full_text, new.case_number, new.court, new.judge, new.bench);
        END""")
    )

    # Create triggers to keep FTS tables in sync with law_sections
    conn.execute(
        text("""CREATE TRIGGER law_sections_ai AFTER INSERT ON law_sections BEGIN
            INSERT INTO law_sections_fts(rowid, law_name, section_number, section_text)
            VALUES (new.id, new.law_name, new.section_number, new.section_text);
        END""")
    )
    conn.execute(
        text("""CREATE TRIGGER law_sections_ad AFTER DELETE ON law_sections BEGIN
            INSERT INTO law_sections_fts(law_sections_fts, rowid, law_name, section_number, section_text)
            VALUES ('delete', old.id, old.law_name, old.section_number, old.section_text);
        END""")
    )
    conn.execute(
        text("""CREATE TRIGGER law_sections_au AFTER UPDATE ON law_sections BEGIN
            INSERT INTO law_sections_fts(law_sections_fts, rowid, law_name, section_number, section_text)
            VALUES ('delete', old.id, old.law_name, old.section_number, old.section_text);
            INSERT INTO law_sections_fts(rowid, law_name, section_number, section_text)
            VALUES (new.id, new.law_name, new.section_number, new.section_text);
        END""")
    )

    # Populate FTS tables with existing data
    conn.execute(
        text("""INSERT INTO judgments_fts(rowid, title, citation, description, full_text, case_number, court, judge, bench)
           SELECT id, title, citation, description, full_text, case_number, court, judge, bench FROM judgments""")
    )
    conn.execute(
        text("""INSERT INTO law_sections_fts(rowid, law_name, section_number, section_text)
           SELECT id, law_name, section_number, section_text FROM law_sections""")
    )


async def rebuild_fts():
    """Manually rebuild the FTS5 indexes."""
    async with engine.begin() as conn:
        await conn.run_sync(_rebuild_fts_exec)


def _rebuild_fts_exec(conn):
    conn.execute(text("INSERT INTO judgments_fts(judgments_fts) VALUES('rebuild')"))
    conn.execute(text("INSERT INTO law_sections_fts(law_sections_fts) VALUES('rebuild')"))
