"""
API endpoint for SCP Portal Latest Judgments & Citations.

This module provides an endpoint to fetch the latest judgments
from the Supreme Court of Pakistan portal (scp.gov.pk).
"""

import json
import logging
import sqlite3
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scp", tags=["scp-judgments"])

# Path to the SCP judgments database
SCP_DB_PATH = Path(__file__).parent.parent.parent.parent / "crawler" / "data" / "scp_judgments.db"


class SCPJudgment(BaseModel):
    """Model for SCP Portal judgment."""
    sr_no: str
    case_subject: str
    case_number: str
    case_title: str
    author_judge: str
    judgment_date: str
    upload_date: str
    citation: str
    sc_citation: str
    pdf_url: str
    source_url: str


def get_db_connection():
    """Get SQLite connection to SCP judgments database."""
    if not SCP_DB_PATH.exists():
        logger.warning(f"SCP database not found at {SCP_DB_PATH}")
        return None
    return sqlite3.connect(str(SCP_DB_PATH))


@router.get("/latest-judgments")
async def get_scp_latest_judgments(
    limit: int = Query(default=25, ge=1, le=100, description="Number of judgments to return"),
    court: Optional[str] = Query(default=None, description="Filter by court name"),
    judge: Optional[str] = Query(default=None, description="Filter by judge name"),
    subject: Optional[str] = Query(default=None, description="Filter by case subject"),
    year: Optional[int] = Query(default=None, description="Filter by judgment year"),
):
    """Get latest judgments from Supreme Court of Pakistan portal.

    Returns judgments with citations from scp.gov.pk/LatestJudgments.
    """
    conn = get_db_connection()
    if not conn:
        # Return empty if database doesn't exist
        return {
            "judgments": [],
            "total": 0,
            "message": "SCP database not available. Run the crawler to populate data.",
        }

    try:
        cursor = conn.cursor()

        # Build query
        query = "SELECT * FROM scp_latest_judgments WHERE 1=1"
        params = []

        if court:
            query += " AND case_title ILIKE ?"
            params.append(f"%{court}%")

        if judge:
            query += " AND author_judge ILIKE ?"
            params.append(f"%{judge}%")

        if subject:
            query += " AND case_subject ILIKE ?"
            params.append(f"%{subject}%")

        if year:
            query += " AND judgment_date LIKE ?"
            params.append(f"%{year}%")

        query += " ORDER BY sr_no DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Get column names
        column_names = [desc[0] for desc in cursor.description]

        judgments = []
        for row in rows:
            judgment_dict = dict(zip(column_names, row))
            judgments.append({
                "sr_no": judgment_dict.get("sr_no", ""),
                "case_subject": judgment_dict.get("case_subject", ""),
                "case_number": judgment_dict.get("case_number", ""),
                "case_title": judgment_dict.get("case_title", ""),
                "author_judge": judgment_dict.get("author_judge", ""),
                "judgment_date": judgment_dict.get("judgment_date", ""),
                "upload_date": judgment_dict.get("upload_date", ""),
                "citation": judgment_dict.get("citation", ""),
                "sc_citation": judgment_dict.get("sc_citation", ""),
                "pdf_url": judgment_dict.get("pdf_url", ""),
                "source_url": judgment_dict.get("source_url", ""),
            })

        return {
            "judgments": judgments,
            "total": len(judgments),
            "source": "Supreme Court of Pakistan Portal",
            "url": "https://scp.gov.pk/LatestJudgments",
        }

    finally:
        conn.close()


@router.get("/latest-judgments/{case_number}")
async def get_scp_judgment_by_case_number(case_number: str):
    """Get a specific judgment by case number from SCP portal."""
    conn = get_db_connection()
    if not conn:
        return {"error": "SCP database not available"}

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM scp_latest_judgments WHERE case_number = ?",
            (case_number,)
        )
        row = cursor.fetchone()

        if not row:
            return {"error": "Judgment not found"}

        column_names = [desc[0] for desc in cursor.description]
        judgment_dict = dict(zip(column_names, row))

        return {
            "sr_no": judgment_dict.get("sr_no", ""),
            "case_subject": judgment_dict.get("case_subject", ""),
            "case_number": judgment_dict.get("case_number", ""),
            "case_title": judgment_dict.get("case_title", ""),
            "author_judge": judgment_dict.get("author_judge", ""),
            "judgment_date": judgment_dict.get("judgment_date", ""),
            "upload_date": judgment_dict.get("upload_date", ""),
            "citation": judgment_dict.get("citation", ""),
            "sc_citation": judgment_dict.get("sc_citation", ""),
            "pdf_url": judgment_dict.get("pdf_url", ""),
            "source_url": judgment_dict.get("source_url", ""),
        }

    finally:
        conn.close()


@router.get("/citations")
async def get_scp_citations(
    limit: int = Query(default=50, ge=1, le=200),
    year: Optional[int] = Query(default=None, description="Filter by year"),
):
    """Get recent citations from SCP portal judgments."""
    conn = get_db_connection()
    if not conn:
        return {"citations": [], "total": 0}

    try:
        cursor = conn.cursor()

        query = """
            SELECT DISTINCT sc_citation, citation, case_title, case_number, 
                   author_judge, judgment_date
            FROM scp_latest_judgments 
            WHERE sc_citation != '' OR citation != ''
        """
        params = []

        if year:
            query += " AND judgment_date LIKE ?"
            params.append(f"%{year}%")

        query += " ORDER BY sr_no DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()

        citations = []
        for row in rows:
            citations.append({
                "sc_citation": row[0] or "",
                "citation": row[1] or "",
                "case_title": row[2] or "",
                "case_number": row[3] or "",
                "judge": row[4] or "",
                "date": row[5] or "",
            })

        return {
            "citations": citations,
            "total": len(citations),
            "source": "Supreme Court of Pakistan Portal",
        }

    finally:
        conn.close()
