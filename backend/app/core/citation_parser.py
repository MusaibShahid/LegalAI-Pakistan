"""
Citation parser for Pakistani legal citations.

Parses citations like:
- 2006 SCMR 109
- PLD 2023 SC 1
- 2023 MLD 1
- YLR 2022 456
- PCrLJ 2021 789

Returns structured data for searching across free sources.
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedCitation:
    """A parsed Pakistani legal citation."""
    year: str = ""
    reporter: str = ""
    page: str = ""
    court: str = ""
    raw: str = ""
    confidence: float = 0.0


# Known Pakistani law reporters
REPORTERS = {
    # Supreme Court
    "SCMR": {"full_name": "Supreme Court Monthly Review", "court": "Supreme Court"},
    "SCR": {"full_name": "Supreme Court Reports", "court": "Supreme Court"},
    "SC": {"full_name": "Supreme Court", "court": "Supreme Court"},
    "PLD": {"full_name": "Pakistan Law Decisions", "court": "All Courts"},
    
    # High Courts
    "CLC": {"full_name": "Current Law Cases", "court": "Lahore High Court"},
    "CLD": {"full_name": "Current Law Digest", "court": "Lahore High Court"},
    "YLR": {"full_name": "Yousef Law Reports", "court": "Lahore High Court"},
    "MLD": {"full_name": "Monthly Law Digest", "court": "All Courts"},
    "PCrLJ": {"full_name": "Pakistan Criminal Law Journal", "court": "All Courts"},
    "PCRLJ": {"full_name": "Pakistan Criminal Law Journal", "court": "All Courts"},
    "PTD": {"full_name": "Pakistan Tax Decisions", "court": "Tax Tribunals"},
    "NLR": {"full_name": "National Law Review", "court": "All Courts"},
    "PLC": {"full_name": "Pakistan Law Commission", "court": "All Courts"},
    "PLJ": {"full_name": "Pakistan Law Journal", "court": "All Courts"},
    "KLR": {"full_name": "Karachi Law Reports", "court": "Sindh High Court"},
    "PLR": {"full_name": "Pakistan Law Reports", "court": "All Courts"},
    "PSC": {"full_name": "President's Sewin Court", "court": "All Courts"},
}

# Citation patterns
CITATION_PATTERNS = [
    # Pattern: 2006 SCMR 109
    re.compile(
        r'(?P<year>\d{4})\s+(?P<reporter>SCMR|SCR|SC|PLD|CLC|CLD|YLR|MLD|PCrLJ|PTD|NLR|PLC|PLJ|KLR|PLR|PSC)\s+(?P<page>\d+)',
        re.IGNORECASE
    ),
    # Pattern: PLD 2023 SC 1
    re.compile(
        r'(?P<reporter>PLD|SCMR|SCR|CLC|CLD|YLR|MLD|PCrLJ|PTD|NLR|PLC|PLJ|KLR|PLR|PSC)\s+(?P<year>\d{4})\s+\w+\s+(?P<page>\d+)',
        re.IGNORECASE
    ),
    # Pattern: Reporter + Year + Page (reverse format: YLR 2022 2345, PCrLJ 2024 156)
    re.compile(
        r'(?P<reporter>SCMR|SCR|YLR|PCrLJ|PCRLJ|PCrlLJ|MLD|PTD|CLD|CLC|SBLR|KLR|MLR|CLL|NLR|PLC|PLJ|PSC|PLD|PLR)\s+(?P<year>\d{4})\s+(?P<page>\d+)',
        re.IGNORECASE
    ),
    # Pattern: 2023 MLD 1 (year before reporter)
    re.compile(
        r'(?P<year>\d{4})\s+(?P<reporter>MLD|NLR|PLC)\s+(?P<page>\d+)',
        re.IGNORECASE
    ),
    # Pattern: PLJ 2024 123 (PLJ format, also handled by above)
    re.compile(
        r'(?P<reporter>PLJ)\s+(?P<year>\d{4})\s+(?P<page>\d+)',
        re.IGNORECASE
    ),
]


def parse_citation(text: str) -> Optional[ParsedCitation]:
    """Parse a Pakistani legal citation from text."""
    text = text.strip()
    
    for pattern in CITATION_PATTERNS:
        match = pattern.search(text)
        if match:
            groups = match.groupdict()
            reporter = groups.get("reporter", "").upper()
            year = groups.get("year", "")
            page = groups.get("page", "")
            
            reporter_info = REPORTERS.get(reporter, {})
            
            return ParsedCitation(
                year=year,
                reporter=reporter,
                page=page,
                court=reporter_info.get("court", ""),
                raw=text,
                confidence=0.9 if reporter in REPORTERS else 0.5,
            )
    
    return None


def extract_citations(text: str) -> list[ParsedCitation]:
    """Extract all citations from text."""
    citations = []
    seen = set()
    
    for pattern in CITATION_PATTERNS:
        for match in pattern.finditer(text):
            groups = match.groupdict()
            reporter = groups.get("reporter", "").upper()
            year = groups.get("year", "")
            page = groups.get("page", "")
            
            key = f"{year}_{reporter}_{page}"
            if key not in seen:
                seen.add(key)
                reporter_info = REPORTERS.get(reporter, {})
                citations.append(ParsedCitation(
                    year=year,
                    reporter=reporter,
                    page=page,
                    court=reporter_info.get("court", ""),
                    raw=match.group(),
                    confidence=0.9 if reporter in REPORTERS else 0.5,
                ))
    
    return citations


def build_search_urls(citation: ParsedCitation) -> list[dict]:
    """Build search URLs for free sources based on parsed citation."""
    urls = []
    
    query = f"{citation.year} {citation.reporter} {citation.page}".strip()
    
    # Supreme Court
    if citation.court in ("Supreme Court", "All Courts"):
        urls.append({
            "source": "Supreme Court of Pakistan",
            "url": f"https://scp.gov.pk/LatestJudgments",
            "search_type": "external",
            "description": f"Search for {query} on Supreme Court website",
        })
    
    # Sindh High Court
    if citation.court in ("Sindh High Court", "All Courts"):
        urls.append({
            "source": "Sindh High Court",
            "url": f"https://caselaw.shc.gov.pk/caselaw/public/home",
            "search_type": "external",
            "description": f"Search for {query} on SHC caselaw portal",
        })
    
    # Lahore High Court
    if citation.court in ("Lahore High Court", "All Courts"):
        urls.append({
            "source": "Lahore High Court",
            "url": f"https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
            "search_type": "external",
            "description": f"Search for {query} on LHC reported judgments",
        })
    
    # Islamabad High Court
    if citation.court in ("All Courts",):
        urls.append({
            "source": "Islamabad High Court",
            "url": f"https://ihc.gov.pk",
            "search_type": "external",
            "description": f"Search for {query} on IHC website",
        })
    
    # Google search as fallback
    urls.append({
        "source": "Google",
        "url": f"https://www.google.com/search?q=%22{query.replace(' ', '+')}%22+site:gov.pk",
        "search_type": "google",
        "description": f"Search for {query} on .pk government sites",
    })
    
    return urls


def get_court_for_reporter(reporter: str) -> str:
    """Get the primary court for a reporter."""
    return REPORTERS.get(reporter.upper(), {}).get("court", "All Courts")


def get_reporter_info(reporter: str) -> dict:
    """Get full info for a reporter."""
    return REPORTERS.get(reporter.upper(), {
        "full_name": reporter,
        "court": "Unknown",
    })
