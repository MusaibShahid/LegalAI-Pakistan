"""
Centralized source configuration for all legal data sources.

Each source defines:
- id: Unique identifier used across spiders, API, and frontend
- name: Display name
- base_url: Root domain
- search_url: Entry point for search/judgment listing
- type: judgment | law | both
- source_type: scrapy | playwright | api
- description: Brief description
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LegalSource:
    id: str
    name: str
    base_url: str
    search_url: str
    type: str  # "judgment" | "law" | "both"
    source_type: str  # "scrapy" | "playwright"
    domain: str
    description: str
    search_params: Optional[dict] = None
    notes: str = ""


# ── Phase 1 Sources ────────────────────────────────────────────────

PHASE1_SOURCES: list[LegalSource] = [
    LegalSource(
        id="supreme_court",
        name="Supreme Court of Pakistan",
        base_url="https://www.supremecourt.gov.pk",
        search_url="https://www.supremecourt.gov.pk/judgement-search/",
        type="judgment",
        source_type="playwright",
        domain="supremecourt.gov.pk",
        description="Supreme Court of Pakistan — all civil, criminal, and constitutional judgments.",
        notes="Search form likely uses POST; requires Playwright for JS-rendered search interface.",
    ),
    LegalSource(
        id="lahore_high_court",
        name="Lahore High Court",
        base_url="https://data.lhc.gov.pk",
        search_url="https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
        type="judgment",
        source_type="scrapy",
        domain="data.lhc.gov.pk",
        description="Lahore High Court — reported and approved judgments.",
        notes="Table-based listing with pagination. Judgment links lead to detail pages or PDFs.",
    ),
    LegalSource(
        id="sindh_high_court",
        name="Sindh High Court",
        base_url="https://caselaw.shc.gov.pk",
        search_url="https://caselaw.shc.gov.pk/caselaw/public/home",
        type="judgment",
        source_type="playwright",
        domain="caselaw.shc.gov.pk",
        description="Sindh High Court — caselaw portal with searchable judgment database.",
        notes="JS-heavy search interface likely requires Playwright. May have search form with multiple fields.",
    ),
    LegalSource(
        id="pakistan_code",
        name="Pakistan Code",
        base_url="https://pakistancode.gov.pk",
        search_url="https://pakistancode.gov.pk/english/LGu0xAD.php",  # Alphabetical listing
        type="law",
        source_type="scrapy",
        domain="pakistancode.gov.pk",
        description="Official repository of Pakistani federal statutes and laws.",
        notes="Multiple listing views: alphabetical, chronological, and by category. Law pages have section detail text.",
    ),
]

# ── Phase 2 Sources (future) ───────────────────────────────────────

PHASE2_SOURCES: list[LegalSource] = [
    LegalSource(
        id="plj_law_site",
        name="PLJ Law Site",
        base_url="https://www.pljlawsite.com",
        search_url="https://www.pljlawsite.com/citationsearch.asp",
        type="both",
        source_type="playwright",
        domain="pljlawsite.com",
        description="Pakistan Law Journal — citation search, case law, and statutes. Subscription required.",
        notes="Requires authentication. Search by citation (PLJ, CLC, MLD, YLR, etc.), court, year, and page number.",
        search_params={
            "books": ["PLJ", "CLC", "MLD", "YLR", "PCrLJ", "SCR", "SCMR", "PLD"],
            "courts": [
                "Supreme Court", "Supreme Court (Criminal)", "Lahore High Court",
                "Karachi High Court", "Peshawar High Court", "Quetta High Court",
                "Islamabad High Court", "Tribunal Cases", "AJ&K Court",
                "Tax Cases", "FSC", "Cr.C", "Law Note (Civil)", "Law Note (Criminal)",
            ],
        },
    ),
    LegalSource(
        id="islamabad_high_court",
        name="Islamabad High Court",
        base_url="https://www.ihc.gov.pk",
        search_url="https://www.ihc.gov.pk/judgments",
        type="judgment",
        source_type="scrapy",
        domain="ihc.gov.pk",
        description="Islamabad High Court judgments and orders.",
        notes="",
    ),
    LegalSource(
        id="peshawar_high_court",
        name="Peshawar High Court",
        base_url="https://www.peshawarhighcourt.gov.pk",
        search_url="https://www.peshawarhighcourt.gov.pk/judgments",
        type="judgment",
        source_type="scrapy",
        domain="peshawarhighcourt.gov.pk",
        description="Peshawar High Court judgments and orders.",
        notes="",
    ),
    LegalSource(
        id="balochistan_high_court",
        name="Balochistan High Court",
        base_url="https://www.bhc.gov.pk",
        search_url="https://www.bhc.gov.pk/judgments",
        type="judgment",
        source_type="scrapy",
        domain="bhc.gov.pk",
        description="Balochistan High Court judgments and orders.",
        notes="",
    ),
]

ALL_SOURCES = PHASE1_SOURCES + PHASE2_SOURCES

SOURCE_MAP: dict[str, LegalSource] = {s.id: s for s in ALL_SOURCES}
