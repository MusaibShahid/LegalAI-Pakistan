import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ClassifiedQuery:
    raw_query: str
    search_type: str  # citation | section | keyword | court | case_number | party
    normalized_query: str
    citation: Optional[str] = None
    section: Optional[str] = None
    court: Optional[str] = None
    year: Optional[int] = None
    case_number: Optional[str] = None
    party_name: Optional[str] = None


# =============================================================================
# Expanded citation patterns covering ALL major Pakistani law report formats
# =============================================================================

# Pattern 1: Year + Abbrev + Page (most common)
#   2024 SCMR 123, 2023 PLD 456, 2024 YLR 789, 2023 CLD 567,
#   2024 MLD 234, 2023 PTD 890, 2024 PCrLJ 111, 2023 CLC 222,
#   2024 PLC 333, 2024 PLC (CS) 444, 2024 PSC 555
CITATION_RE_STANDARD = re.compile(
    r"(\d{4})\s+(SCMR|PLD|YLR|CLD|MLD|PTD|PCrLJ|CLC|PLC(?:\(CS\))?|"
    r"PSC(?:\(CS\))?|P Cr\.LJ|PCRLJ|PSCLJ|PCrlLJ|PCrLJ|P L D|PSC|NLR|"
    r"SBLR|MBLR|KLR|MLR|CLL|CLD)",
    re.IGNORECASE,
)

# Pattern 2: PLD + Year + Court + Page (PLD-specific format)
#   PLD 2024 SC 123, PLD 2023 LHC 456, PLD 2024 SHC 789
CITATION_RE_PLD = re.compile(
    r"(PLD|Journal)\s+(\d{4})\s+(SC|SCP|LHC|SHC|IHC|PHC|BHC|FSC|SBLR|KHC|Lahore|Karachi|Peshawar|Quetta|Balochistan|Azad Kashmir|AJK)\s+(\d+)",
    re.IGNORECASE,
)

# Pattern 3: NLR + Year + Subject + Page
#   NLR 2024 Civil 123, NLR 2023 Criminal 456
CITATION_RE_NLR = re.compile(
    r"NLR\s+(\d{4})\s+(\w+)\s+(\d+)",
    re.IGNORECASE,
)

# Pattern 4: Year + Journal + Page (for some older formats)
#   2024 CLC 123, 2024 PLC 456
CITATION_RE_SIMPLE = re.compile(
    r"(\d{4})\s+(CLC|PLC)\s+(\d+)",
    re.IGNORECASE,
)

# Pattern 5: Reporter + Year + Page (reverse order of standard)
#   YLR 2022 2345, PCrLJ 2024 156, MLD 2024 789, PTD 2023 2100
#   CLD 2024 456, CLC 2023 567, SBLR 2024 123, KLR 2024 456
CITATION_RE_REVERSE = re.compile(
    r"(YLR|PCrLJ|PCRLJ|PCrlLJ|MLD|PTD|CLD|CLC|SBLR|MBLR|KLR|MLR|CLL|PLC|PSC|NLR|SCMR)"
    r"\s+(\d{4})\s+(\d+)",
    re.IGNORECASE,
)


# =============================================================================
# Case Number patterns (e.g., "Crl.A. No. 123/2024", "W.P. No. 456/2023", etc.)
# =============================================================================
CASE_NUMBER_RE = re.compile(
    r"(?:"
    r"Crl\.A\.?|Crl\.P\.?|Criminal\s+Appeal|Criminal\s+Petition|"
    r"W\.P\.|Writ\s+Petition|"
    r"C\.P\.|Civil\s+Petition|"
    r"RFA|RSA|SAO|FAO|CMA|IA|CA|"
    r"Civil\s+Appeal|Civil\s+Suit|Suit|"
    r"Constitutional\s+Petition|Const\.P\.|"
    r"Tax\s+Reference|Tax\s+Appeal|Income\s+Tax\s+Reference|"
    r"Family\s+Appeal|Family\s+Case|"
    r"Customs\s+Appeal|Customs\s+Reference|"
    r"Service\s+Appeal|Service\s+Tribunal|"
    r"Criminal\s+Revision|Cri\.Rev\.|"
    r"Civil\s+Revision|Civ\.Rev\.|"
    r"Execution|Execution\s+Petition|"
    r"Miscellaneous|Misc\.|"
    r"Company\s+Appeal|Company\s+Petition|"
    r"Arbitration\s+Appeal|Arbitration\s+Petition|"
    r"Lahore\s+Bar\s+Association|LBA)"
    r"[\s,]+(?:No\.?\s*)?(\d+[A-Z]?)(?:[/-])(\d{4})",
    re.IGNORECASE,
)


# =============================================================================
# Party name patterns (e.g., "Muhammad Ali v. The State", "X vs Y")
# =============================================================================
PARTY_RE = re.compile(
    r"^(.+?)\s+(?:v\.|Vs\.|vs\.|versus|v|vs)\s+(.+)$",
    re.IGNORECASE,
)


# =============================================================================
# Expanded section/ordinance/act patterns
# =============================================================================

SECTION_RE = re.compile(
    r"(?:Section\s+)?(\d+[A-Z]?(?:\(?[a-z0-9]+\)?)?(?:-[A-Z])?)"
    r"\s+(?:of\s+(?:the\s+)?)?("
    r"PPC|Pakistan\s*Penal\s*Code|"
    r"CrPC|Criminal\s+Procedure\s+Code|"
    r"C\s*PC|Civil\s+Procedure\s+Code|"
    r"PECA|Prevention\s+of\s+Electronic\s+Crimes|"
    r"EA|Evidence\s+Act|"
    r"QSO|Qanun\-e\-Shahadat\s+Order|"
    r"PA|Police\s+Order|Police\s+Act|"
    r"SGO|Standing\s+Ground\s+Order|"
    r"ATA|Anti\s+Terrorism\s+Act|"
    r"NAB|National\+Accountability\s+Bureau|"
    r"CSCA|Customs\s+Act|"
    r"SA|Sales\s+Tax\s+Act|Sindh\s+Sales\s+Tax|"
    r"ITA|Income\s+Tax\s+Ordinance|"
    r"MFLO|Muslim\s+Family\s+Laws\s+Ordinance|"
    r"DMMA|Dissolution\s+of\s+Muslim\s+Marriages\s+Act|"
    r"FPA|Family\s+Protection\s+Act|"
    r"CLA|Contract\s+Act|Contract\s+Law|"
    r"TPA|Transfer\s+of\s+Property\s+Act|"
    r"SGA|Specific\s+Relief\s+Act|"
    r"LA|Limitation\s+Act|"
    r"LRA|Land\s+Revenue\s+Act|"
    r"PCO|Political\s+Parties\s+Order|"
    r"EO|Election\s+Act|Election\s+Ordinance|"
    r"NGO|National\s+Highway\s+Authority|"
    r"RPA|Registration\s+of\s+Population|"
    r"BSA|Banks\s+Act|"
    r"CO|Companies\s+Ordinance|Companies\s+Act|"
    r"LRA|Labour\s+Relations|"
    r"CPC|Code\s+of\s+Criminal\s+Procedure|"
    r"NLC|Narcotics|Control\s+of\s+Narcotics|"
    r"EPA|Environmental\s+Protection)",
    re.IGNORECASE,
)

ARTICLE_RE = re.compile(
    r"Article\s+(\d+[A-Z]?(?:\(?[a-z0-9]+\)?)?)",
    re.IGNORECASE,
)

ORDINANCE_RE = re.compile(
    r"(?:Ordinance|Act|Law|Code|Regulation|Order|Rules)\s+(?:No\.?\s+)?(\d+)(?:\s+of\s+(\d{4}))?",
    re.IGNORECASE,
)


# =============================================================================
# Court name patterns
# =============================================================================

COURT_RE = re.compile(
    r"(?:"
    r"Supreme Court(?: of Pakistan)?|"
    r"Lahore High Court|"
    r"Sindh High Court|"
    r"Islamabad High Court|"
    r"Peshawar High Court|"
    r"Balochistan High Court|"
    r"AJK Supreme Court|Azad Kashmir Supreme Court|"
    r"AJK High Court|Azad Kashmir High Court|"
    r"Federal Shariat Court|"
    r"Service Tribunal|Federal Service Tribunal|Provincial Service Tribunal|"
    r"Anti[\s-]Terrorism Court|"
    r"Special Court|Banking Court|Customs Court|Tax Court|Drugs Court|"
    r"Session Court|District Court|Civil Court|Family Court|"
    r"Supreme Appellate Court|Gilgit-Baltistan Supreme Appellate Court|"
    r"Accountability Court|NAB Court"
    r")",
    re.IGNORECASE,
)

YEAR_RE = re.compile(r"\b(19\d{2}|20\d{2})\b")

# Additional terms to detect
SUBJECT_RE = re.compile(
    r"(?:"
    r"bail|murder|qatl|homicide|robbery|dacoity|kidnapping|rape|zina|"
    r"corruption|terrorism|cybercrime|fraud|forgery|smuggling|narcotics|"
    r"divorce|khula|maintenance|custody|guardianship|dower|mehr|"
    r"inheritance|succession|will|wasiyat|"
    r"tax|income\s*tax|sales\s*tax|customs|excise|"
    r"land|property|revenue|possession|tenancy|eviction|"
    r"service|appointment|promotion|retirement|pension|termination|"
    r"contract|agreement|breach|damages|compensation|"
    r"constitution|fundamental\s*rights|writ|petition|"
    r"limitation|prescription|adverse\s*possession|"
    r"arbitration|mediation|alternative\s*dispute"
    r")",
    re.IGNORECASE,
)


class QueryClassifier:
    """Classifies legal search queries by type.

    Detection priority:
    1. Citation (e.g., "2024 SCMR 123", "PLD 2024 SC 456")
    2. Case Number (e.g., "Crl.A. No. 123/2024", "W.P. 456/2023")
    3. Section / Article / Ordinance (e.g., "302 PPC", "Article 199")
    4. Court name (e.g., "Supreme Court of Pakistan")
    5. Party name pattern (e.g., "X v. Y")
    6. Default: Keyword search
    """

    def classify(self, query: str) -> ClassifiedQuery:
        query = query.strip()
        normalized = query

        # 1. Try citation pattern (highest priority)
        # 1a. Standard year-abbrev-page
        citation_match = CITATION_RE_STANDARD.search(query)
        if citation_match:
            year = int(citation_match.group(1))
            full_citation = citation_match.group(0)
            return ClassifiedQuery(
                raw_query=query,
                search_type="citation",
                normalized_query=full_citation,
                citation=full_citation,
                year=year,
            )

        # 1b. PLD special format: PLD YYYY Court Page
        pld_match = CITATION_RE_PLD.search(query)
        if pld_match:
            year = int(pld_match.group(2))
            full_citation = pld_match.group(0)
            return ClassifiedQuery(
                raw_query=query,
                search_type="citation",
                normalized_query=full_citation,
                citation=full_citation,
                year=year,
            )

        # 1c. Simple citation: YYYY CLC/PLC NNN
        simple_cit_match = CITATION_RE_SIMPLE.search(query)
        if simple_cit_match:
            year = int(simple_cit_match.group(1))
            full_citation = simple_cit_match.group(0)
            return ClassifiedQuery(
                raw_query=query,
                search_type="citation",
                normalized_query=full_citation,
                citation=full_citation,
                year=year,
            )

        # 1d. NLR format
        nlr_match = CITATION_RE_NLR.search(query)
        if nlr_match:
            year = int(nlr_match.group(1))
            full_citation = nlr_match.group(0)
            return ClassifiedQuery(
                raw_query=query,
                search_type="citation",
                normalized_query=full_citation,
                citation=full_citation,
                year=year,
            )

        # 1e. Reverse format: Reporter + Year + Page (e.g., "YLR 2022 2345")
        reverse_match = CITATION_RE_REVERSE.search(query)
        if reverse_match:
            year = int(reverse_match.group(2))
            full_citation = reverse_match.group(0)
            return ClassifiedQuery(
                raw_query=query,
                search_type="citation",
                normalized_query=full_citation,
                citation=full_citation,
                year=year,
            )

        # 2. Try case number pattern
        case_match = CASE_NUMBER_RE.search(query)
        if case_match:
            return ClassifiedQuery(
                raw_query=query,
                search_type="case_number",
                normalized_query=query,
                case_number=case_match.group(0).strip(),
                year=int(case_match.group(3)) if case_match.group(3) else None,
            )

        # 3. Try section pattern
        section_match = SECTION_RE.search(query)
        if section_match:
            section_num = section_match.group(1)
            law = section_match.group(2).upper()
            return ClassifiedQuery(
                raw_query=query,
                search_type="section",
                normalized_query=f"{section_num} {law}",
                section=f"{section_num} {law}",
            )

        # 4. Try article pattern
        article_match = ARTICLE_RE.search(query)
        if article_match:
            return ClassifiedQuery(
                raw_query=query,
                search_type="section",
                normalized_query=f"Article {article_match.group(1)}",
                section=f"Article {article_match.group(1)}",
            )

        # 5. Try ordinance/law pattern
        ord_match = ORDINANCE_RE.search(query)
        if ord_match:
            return ClassifiedQuery(
                raw_query=query,
                search_type="section",
                normalized_query=query,
                section=ord_match.group(0),
            )

        # 6. Try court pattern
        court_match = COURT_RE.search(query)
        if court_match:
            year_match = YEAR_RE.search(query)
            return ClassifiedQuery(
                raw_query=query,
                search_type="court",
                normalized_query=query,
                court=court_match.group(0).strip(),
                year=int(year_match.group(0)) if year_match else None,
            )

        # 7. Try party name pattern (e.g., "X v. Y")
        party_match = PARTY_RE.match(query)
        if party_match:
            return ClassifiedQuery(
                raw_query=query,
                search_type="party",
                normalized_query=query,
                party_name=query,
            )

        # 8. Check if it's a subject-specific search
        subject_match = SUBJECT_RE.search(query)
        if subject_match:
            return ClassifiedQuery(
                raw_query=query,
                search_type="keyword",
                normalized_query=query,
            )

        # 9. Default: keyword search
        return ClassifiedQuery(
            raw_query=query,
            search_type="keyword",
            normalized_query=query,
        )


# =============================================================================
# Utility: Extract all citation-like strings from arbitrary text
# =============================================================================

def extract_all_citations(text: str) -> list[str]:
    """Extract all citations found in a block of text."""
    citations = set()
    for pattern in [CITATION_RE_STANDARD, CITATION_RE_PLD, CITATION_RE_SIMPLE, CITATION_RE_NLR, CITATION_RE_REVERSE]:
        for match in pattern.finditer(text):
            citations.add(match.group(0))
    return sorted(citations)
