"""
Source Registry for LegalSearch Pakistan.

Manages all legal data sources with their capabilities,
health status, and access methods.
"""

import asyncio
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class SourceType(str, Enum):
    COURT = "court"
    LAW = "law"
    CITATION = "citation"
    ARCHIVE = "archive"
    AGGREGATOR = "aggregator"


class SourceStatus(str, Enum):
    ACTIVE = "active"
    DEGRADED = "degraded"
    BLOCKED = "blocked"
    DOWN = "down"
    UNKNOWN = "unknown"


class AccessMethod(str, Enum):
    HTTP = "http"
    PLAYWRIGHT = "playwright"
    API = "api"
    CACHE = "cache"


@dataclass
class SourceCapabilities:
    """What a source can search for."""
    has_judgments: bool = False
    has_laws: bool = False
    has_citations: bool = False
    has_sections: bool = False
    has_full_text: bool = False
    has_pdf: bool = False
    has_court_info: bool = False


@dataclass
class SourceHealth:
    """Health tracking for a source."""
    status: SourceStatus = SourceStatus.UNKNOWN
    last_check: float = 0.0
    last_success: float = 0.0
    consecutive_failures: int = 0
    avg_response_time: float = 0.0
    success_rate: float = 1.0
    total_requests: int = 0
    total_failures: int = 0


@dataclass
class LegalSource:
    """A registered legal data source."""
    key: str
    name: str
    source_type: SourceType
    base_url: str
    access_method: AccessMethod
    capabilities: SourceCapabilities
    rate_limit: float = 5.0  # seconds between requests
    priority: int = 50  # higher = searched first
    health: SourceHealth = field(default_factory=SourceHealth)
    search_url_pattern: str = ""  # URL template for search
    notes: str = ""


class SourceRegistry:
    """Registry of all legal data sources."""

    def __init__(self):
        self._sources: dict[str, LegalSource] = {}
        self._register_default_sources()

    def register(self, source: LegalSource):
        """Register a data source."""
        self._sources[source.key] = source

    def get(self, key: str) -> Optional[LegalSource]:
        """Get a source by key."""
        return self._sources.get(key)

    def get_all(self) -> list[LegalSource]:
        """Get all registered sources."""
        return list(self._sources.values())

    def get_active(self, source_type: Optional[SourceType] = None) -> list[LegalSource]:
        """Get all active sources, optionally filtered by type."""
        sources = [
            s for s in self._sources.values()
            if s.health.status in (SourceStatus.ACTIVE, SourceStatus.DEGRADED, SourceStatus.UNKNOWN)
        ]
        if source_type:
            sources = [s for s in sources if s.source_type == source_type]
        return sorted(sources, key=lambda s: s.priority, reverse=True)

    def get_for_search_type(self, search_type: str) -> list[LegalSource]:
        """Get sources that can handle a specific search type."""
        sources = self.get_active()
        if search_type == "citation":
            return [s for s in sources if s.capabilities.has_citations]
        elif search_type == "section":
            return [s for s in sources if s.capabilities.has_sections]
        elif search_type == "law":
            return [s for s in sources if s.capabilities.has_laws]
        elif search_type == "judgment":
            return [s for s in sources if s.capabilities.has_judgments]
        elif search_type == "case_number":
            return [s for s in sources if s.capabilities.has_judgments]
        return sources

    def update_health(self, key: str, success: bool, response_time: float = 0.0):
        """Update health status for a source."""
        source = self._sources.get(key)
        if not source:
            return

        h = source.health
        h.last_check = time.time()
        h.total_requests += 1

        if success:
            h.last_success = time.time()
            h.consecutive_failures = 0
            h.status = SourceStatus.ACTIVE
            # Running average of response time
            if h.avg_response_time == 0:
                h.avg_response_time = response_time
            else:
                h.avg_response_time = (h.avg_response_time * 0.8) + (response_time * 0.2)
        else:
            h.consecutive_failures += 1
            h.total_failures += 1
            if h.consecutive_failures >= 3:
                h.status = SourceStatus.DOWN
            elif h.consecutive_failures >= 1:
                h.status = SourceStatus.DEGRADED

        # Update success rate
        if h.total_requests > 0:
            h.success_rate = 1 - (h.total_failures / h.total_requests)

    def _register_default_sources(self):
        """Register all default Pakistani legal sources."""

        # ─── Local Database (always available) ──────────────────
        self.register(LegalSource(
            key="local_db",
            name="Local Database",
            source_type=SourceType.LAW,
            base_url="",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_laws=True,
                has_citations=True,
                has_sections=True,
                has_full_text=True,
                has_pdf=True,
            ),
            priority=100,  # Highest priority - search first
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Local SQLite FTS5 database",
        ))

        # ─── Pakistan Code ──────────────────────────────────────
        self.register(LegalSource(
            key="pakistancode",
            name="Pakistan Code",
            source_type=SourceType.LAW,
            base_url="https://pakistancode.gov.pk",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_laws=True,
                has_sections=True,
                has_full_text=True,
            ),
            rate_limit=3.0,
            priority=80,
            search_url_pattern="https://pakistancode.gov.pk/english/search?q={query}",
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Federal statutes, ordinances, rules",
        ))

        # ─── DRS (Ministry of Law) ─────────────────────────────
        self.register(LegalSource(
            key="drs",
            name="Document Retrieval System",
            source_type=SourceType.LAW,
            base_url="https://drs.molaw.gov.pk",
            access_method=AccessMethod.API,
            capabilities=SourceCapabilities(
                has_laws=True,
                has_sections=True,
                has_full_text=True,
            ),
            rate_limit=2.0,
            priority=75,
            search_url_pattern="https://drs.molaw.gov.pk/search?q={query}",
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="AI-powered legal assistant, Acts, Ordinances, Rules",
        ))

        # ─── Lahore High Court ──────────────────────────────────
        self.register(LegalSource(
            key="lhc",
            name="Lahore High Court",
            source_type=SourceType.COURT,
            base_url="https://lhc.gov.pk",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
                has_pdf=True,
            ),
            rate_limit=5.0,
            priority=70,
            search_url_pattern="https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Reported judgments, green bench orders",
        ))

        # ─── Islamabad High Court ───────────────────────────────
        self.register(LegalSource(
            key="ihc",
            name="Islamabad High Court",
            source_type=SourceType.COURT,
            base_url="https://ihc.gov.pk",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
            ),
            rate_limit=5.0,
            priority=65,
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
        ))

        # ─── Federal Shariat Court ──────────────────────────────
        self.register(LegalSource(
            key="fsc",
            name="Federal Shariat Court",
            source_type=SourceType.COURT,
            base_url="https://www.federalshariatcourt.gov.pk",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
            ),
            rate_limit=5.0,
            priority=60,
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
        ))

        # ─── Supreme Court (blocked - use fallback) ─────────────
        self.register(LegalSource(
            key="scp",
            name="Supreme Court of Pakistan",
            source_type=SourceType.COURT,
            base_url="https://scp.gov.pk",
            access_method=AccessMethod.PLAYWRIGHT,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
                has_pdf=True,
            ),
            rate_limit=10.0,
            priority=90,  # High priority but blocked
            health=SourceHealth(status=SourceStatus.BLOCKED, last_check=time.time()),
            notes="Blocked by WAF. Use Wayback Machine or Google Cache fallback.",
        ))

        # ─── Sindh High Court (login required) ──────────────────
        self.register(LegalSource(
            key="shc",
            name="Sindh High Court",
            source_type=SourceType.COURT,
            base_url="https://caselaw.shc.gov.pk",
            access_method=AccessMethod.PLAYWRIGHT,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
            ),
            rate_limit=8.0,
            priority=65,
            health=SourceHealth(status=SourceStatus.DEGRADED, last_check=time.time()),
            notes="Behind login wall. Use Playwright or Google Cache.",
        ))

        # ─── Peshawar High Court ────────────────────────────────
        self.register(LegalSource(
            key="phc",
            name="Peshawar High Court",
            source_type=SourceType.COURT,
            base_url="https://phc.gov.pk",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
            ),
            rate_limit=5.0,
            priority=60,
            health=SourceHealth(status=SourceStatus.UNKNOWN),
        ))

        # ─── Balochistan High Court ─────────────────────────────
        self.register(LegalSource(
            key="bhc",
            name="Balochistan High Court",
            source_type=SourceType.COURT,
            base_url="https://bhc.gov.pk",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
            ),
            rate_limit=5.0,
            priority=55,
            health=SourceHealth(status=SourceStatus.DEGRADED, last_check=time.time()),
            notes="May have CAPTCHA protection.",
        ))

        # ─── Pakistani.org (Constitution) ───────────────────────
        self.register(LegalSource(
            key="pakistani_org",
            name="Pakistani.org",
            source_type=SourceType.LAW,
            base_url="https://www.pakistani.org",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_laws=True,
                has_sections=True,
                has_full_text=True,
            ),
            rate_limit=2.0,
            priority=70,
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Constitution, legislative history",
        ))

        # ─── Google Scholar (aggregator) ────────────────────────
        self.register(LegalSource(
            key="google_scholar",
            name="Google Scholar",
            source_type=SourceType.AGGREGATOR,
            base_url="https://scholar.google.com",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_citations=True,
            ),
            rate_limit=10.0,
            priority=50,
            search_url_pattern="https://scholar.google.com/scholar?q={query}&as_sdt=0,5",
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Case law aggregator. Conservative rate limiting to avoid CAPTCHA.",
        ))

        # ─── Wayback Machine (archive) ──────────────────────────
        self.register(LegalSource(
            key="wayback",
            name="Wayback Machine",
            source_type=SourceType.ARCHIVE,
            base_url="https://web.archive.org",
            access_method=AccessMethod.API,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_laws=True,
                has_full_text=True,
            ),
            rate_limit=1.0,
            priority=30,  # Lower priority - fallback
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Archived versions of court sites. Use availability API.",
        ))

        # ─── Google Cache (archive) ─────────────────────────────
        self.register(LegalSource(
            key="google_cache",
            name="Google Cache",
            source_type=SourceType.ARCHIVE,
            base_url="https://webcache.googleusercontent.com",
            access_method=AccessMethod.HTTP,
            capabilities=SourceCapabilities(
                has_judgments=True,
                has_laws=True,
                has_full_text=True,
            ),
            rate_limit=5.0,
            priority=25,  # Lower priority - fallback
            health=SourceHealth(status=SourceStatus.ACTIVE, last_success=time.time()),
            notes="Google cached versions of pages.",
        ))


# Global registry instance
registry = SourceRegistry()
