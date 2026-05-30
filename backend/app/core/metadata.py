import re
from typing import Optional

# Common Pakistani citation patterns
CITATION_PATTERNS = [
    r"\d{4}\s+(SCMR|PLD|YLR|CLD|MLD|PTD|PCrLJ)\s+\d+",
    r"PLD\s+\d{4}\s+(SC|LHC|SHC|IHC|PHC|BHC)\s+\d+",
    r"\d{4}\s+PLC\s+\(?CS\)?\s+\d+",
    r"NLR\s+-\s+\d{4}\s+\w+\s+\d+",
]

# Common Pakistani law/section patterns
SECTION_PATTERNS = [
    r"(\d+[A-Z]?(?:-[A-Z])?)\s+(PPC|CrPC|C PC|PECA|EA|QSO)",
    r"Article\s+\d+[A-Z]?(?:\(?\d+\)?)?",
    r"Section\s+\d+(?:\(?\d+\)?)?\s+(?:of\s+)?(?:the\s+)?(?:Pakistan\s+)?(?:Penal\s+)?Code",
]


def extract_citation(text: str) -> Optional[str]:
    """Extract a legal citation from text."""
    for pattern in CITATION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0)
    return None


def extract_sections(text: str) -> list[str]:
    """Extract referenced legal sections from text."""
    sections = []
    for pattern in SECTION_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                sections.append(f"{match[0]} {match[1]}")
            else:
                sections.append(match)
    return sections


def classify_query(query: str) -> str:
    """Classify a search query into one of: citation, section, keyword, court."""
    # Check if it's a citation query
    for pattern in CITATION_PATTERNS:
        if re.search(pattern, query.strip(), re.IGNORECASE):
            return "citation"

    # Check if it's a section query
    for pattern in SECTION_PATTERNS:
        if re.search(pattern, query.strip(), re.IGNORECASE):
            return "section"

    # Check if it's a court-specific query
    court_pattern = r"(Supreme Court|High Court|Lahore High Court|Sindh High Court|Islamabad High Court|Peshawar High Court|Balochistan High Court)"
    if re.search(court_pattern, query, re.IGNORECASE):
        return "court"

    return "keyword"


def compute_relevance_score(
    query: str,
    title: str = "",
    citation: str = "",
    description: str = "",
    full_text: str = "",
) -> float:
    """Compute a simple relevance score for a document against a query."""
    query_lower = query.lower()
    score = 0.0

    # Exact citation match
    if citation and query_lower.strip() == citation.lower().strip():
        score += 100.0

    # Title match
    if title and query_lower in title.lower():
        score += 30.0

    # Description match
    if description and query_lower in description.lower():
        score += 15.0

    # Section reference match
    sections = extract_sections(query)
    if sections:
        for section in sections:
            if section.lower() in (title + " " + description + " " + full_text).lower():
                score += 20.0

    # Keyword frequency in full text
    if full_text:
        words = query_lower.split()
        for word in words:
            if len(word) > 3:
                count = full_text.lower().count(word)
                score += min(count * 2, 10.0)

    return score
