"""
Data source configuration for Pakistani legal data.

Defines all accessible data sources with their URL patterns,
access methods, and safety parameters.
"""

from dataclasses import dataclass, field


@dataclass
class DataSource:
    """Configuration for a legal data source."""
    name: str
    key: str
    base_url: str
    source_type: str  # court, law, archive, social, aggregator
    court_level: str  # supreme, high, district, federal
    status: str  # active, blocked, login_required, archived
    access_method: str  # http, playwright, api, rss, manual
    rate_limit: float = 5.0  # seconds between requests
    notes: str = ""
    endpoints: dict = field(default_factory=dict)


# ── All Pakistani Legal Data Sources ───────────────────────────

DATA_SOURCES = {
    # ─── Supreme Court ──────────────────────────────────────────
    "scp": DataSource(
        name="Supreme Court of Pakistan",
        key="scp",
        base_url="https://scp.gov.pk",
        source_type="court",
        court_level="supreme",
        status="blocked",
        access_method="playwright",
        rate_limit=10.0,
        notes="Blocked by WAF. Use Playwright with stealth or Wayback Machine fallback.",
        endpoints={
            "judgments": "/judgment/{year}/{id}",
            "latest": "/LatestJudgments",
            "search": "/judgement-search",
        },
    ),
    "supremecourt": DataSource(
        name="Supreme Court (Old Site)",
        key="supremecourt",
        base_url="https://www.supremecourt.gov.pk",
        source_type="court",
        court_level="supreme",
        status="blocked",
        access_method="playwright",
        rate_limit=10.0,
        notes="Akamai CDN blocking. Use Playwright or archive.org.",
        endpoints={
            "judgments": "/judgement-search/",
            "annual_reports": "/annual-reports/",
        },
    ),

    # ─── High Courts ────────────────────────────────────────────
    "lhc": DataSource(
        name="Lahore High Court",
        key="lhc",
        base_url="https://lhc.gov.pk",
        source_type="court",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=5.0,
        notes="Accessible. data.lhc.gov.pk has structured data portal.",
        endpoints={
            "reported_judgments": "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
            "green_bench": "https://data.lhc.gov.pk/reported_judgments/green_bench_orders",
            "cause_list": "https://data.lhc.gov.pk/case_management/regular_cause_list",
            "roster": "https://data.lhc.gov.pk/case_management/roster_of_sittings",
        },
    ),
    "shc": DataSource(
        name="Sindh High Court",
        key="shc",
        base_url="https://caselaw.shc.gov.pk",
        source_type="court",
        court_level="high",
        status="login_required",
        access_method="playwright",
        rate_limit=8.0,
        notes="Behind login wall. Try Playwright with credentials or use Google Cache.",
        endpoints={
            "login": "/caselaw/public/home",
            "search": "/caselaw/public/judgment/search",
        },
    ),
    "ihc": DataSource(
        name="Islamabad High Court",
        key="ihc",
        base_url="https://ihc.gov.pk",
        source_type="court",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=5.0,
        notes="Check accessibility. May have Cloudflare protection.",
        endpoints={
            "judgments": "/Judgments",
        },
    ),
    "phc": DataSource(
        name="Peshawar High Court",
        key="phc",
        base_url="https://phc.gov.pk",
        source_type="court",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=5.0,
        notes="Check accessibility.",
        endpoints={
            "judgments": "/judgments",
        },
    ),
    "bhc": DataSource(
        name="Balochistan High Court",
        key="bhc",
        base_url="https://bhc.gov.pk",
        source_type="court",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=5.0,
        notes="Check accessibility.",
        endpoints={
            "judgments": "/judgments",
        ),
    ),
    "fsc": DataSource(
        name="Federal Shariat Court",
        key="fsc",
        base_url="https://www.federalshariatcourt.gov.pk",
        source_type="court",
        court_level="federal",
        status="active",
        access_method="http",
        rate_limit=5.0,
        notes="Check accessibility.",
        endpoints={
            "judgments": "/en/",
        },
    ),

    # ─── Law Databases ─────────────────────────────────────────
    "pakistancode": DataSource(
        name="Pakistan Code",
        key="pakistancode",
        base_url="https://pakistancode.gov.pk",
        source_type="law",
        court_level="federal",
        status="active",
        access_method="http",
        rate_limit=3.0,
        notes="Federal statutes. Encrypted URLs. Has mobile apps.",
        endpoints={
            "laws": "/english/LGu0xAD.php",
            "search": "/english/search",
            "categories": "/english/categories",
        },
    ),
    "drs": DataSource(
        name="Document Retrieval System",
        key="drs",
        base_url="https://drs.molaw.gov.pk",
        source_type="law",
        court_level="federal",
        status="active",
        access_method="api",
        rate_limit=2.0,
        notes="AI-powered legal assistant. Has chatbot API. Acts, Ordinances, Rules.",
        endpoints={
            "chatbot": "/Chatbot/Stream",
            "documents": "/documents/document-versions",
            "search": "/search",
        },
    ),
    "pakistani_org": DataSource(
        name="Pakistani.org",
        key="pakistani_org",
        base_url="https://www.pakistani.org",
        source_type="archive",
        court_level="federal",
        status="active",
        access_method="http",
        rate_limit=2.0,
        notes="Constitution, legislative history, some judgments. Academic project.",
        endpoints={
            "constitution": "/pakistan/constitution/",
            "law": "/pakistan/law/",
        },
    ),

    # ─── Archives & Aggregators ─────────────────────────────────
    "wayback": DataSource(
        name="Wayback Machine",
        key="wayback",
        base_url="https://web.archive.org",
        source_type="archive",
        court_level="all",
        status="active",
        access_method="api",
        rate_limit=1.0,
        notes="Archived versions of court sites. Use availability API.",
        endpoints={
            "availability": "/wayback/available?url={url}",
            "web": "/web/{timestamp}/{url}",
        },
    ),
    "google_cache": DataSource(
        name="Google Cache",
        key="google_cache",
        base_url="https://webcache.googleusercontent.com",
        source_type="archive",
        court_level="all",
        status="active",
        access_method="http",
        rate_limit=5.0,
        notes="Cached versions of pages. Use: /search?q=cache:{url}",
        endpoints={
            "cache": "/search?q=cache:{url}",
        },
    ),
    "google_scholar": DataSource(
        name="Google Scholar",
        key="google_scholar",
        base_url="https://scholar.google.com",
        source_type="aggregator",
        court_level="all",
        status="active",
        access_method="http",
        rate_limit=10.0,
        notes="Case law search. Use very conservative rate limiting to avoid CAPTCHA.",
        endpoints={
            "search": "/scholar?q={query}&as_sdt=0,5&as_ylo={year}",
        },
    ),
    "worldlii": DataSource(
        name="WorldLII",
        key="worldlii",
        base_url="https://www.worldlii.org",
        source_type="aggregator",
        court_level="all",
        status="active",
        access_method="playwright",
        rate_limit=8.0,
        notes="World Legal Information Institute. Pakistan database. Cloudflare protected.",
        endpoints={
            "pakistan": "/cgi-bin/disp.pl/db/pk",
            "search": "/cgi-bin/sinosrch.cgi?method=boolean&db=pk&query={query}",
        },
    ),

    # ─── Social Media ──────────────────────────────────────────
    "facebook_scp": DataSource(
        name="SC Facebook",
        key="facebook_scp",
        base_url="https://www.facebook.com",
        source_type="social",
        court_level="supreme",
        status="active",
        access_method="http",
        rate_limit=15.0,
        notes="Supreme Court Facebook page. Use mobile version (m.facebook.com).",
        endpoints={
            "page": "/SupremeCourtOfPakistan",
        },
    ),
    "facebook_lhc": DataSource(
        name="LHC Facebook",
        key="facebook_lhc",
        base_url="https://www.facebook.com",
        source_type="social",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=15.0,
        notes="Lahore High Court Facebook page.",
        endpoints={
            "page": "/LahoreHighCourt",
        },
    ),
    "facebook_shc": DataSource(
        name="SHC Facebook",
        key="facebook_shc",
        base_url="https://www.facebook.com",
        source_type="social",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=15.0,
        notes="Sindh High Court Facebook page.",
        endpoints={
            "page": "/SindhHighCourtOfficial",
        },
    ),
    "facebook_phc": DataSource(
        name="PHC Facebook",
        key="facebook_phc",
        base_url="https://www.facebook.com",
        source_type="social",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=15.0,
        notes="Peshawar High Court Facebook page.",
        endpoints={
            "page": "/PeshawarHighCourt",
        },
    ),
    "facebook_bhc": DataSource(
        name="BHC Facebook",
        key="facebook_bhc",
        base_url="https://www.facebook.com",
        source_type="social",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=15.0,
        notes="Balochistan High Court Facebook page.",
        endpoints={
            "page": "/BalochistanHighCourt",
        },
    ),
    "facebook_ihc": DataSource(
        name="IHC Facebook",
        key="facebook_ihc",
        base_url="https://www.facebook.com",
        source_type="social",
        court_level="high",
        status="active",
        access_method="http",
        rate_limit=15.0,
        notes="Islamabad High Court Facebook page.",
        endpoints={
            "page": "/IslamabadHighCourt",
        },
    ),
}


def get_source(key: str) -> DataSource | None:
    """Get a data source by key."""
    return DATA_SOURCES.get(key)


def get_active_sources(source_type: str | None = None) -> list[DataSource]:
    """Get all active data sources, optionally filtered by type."""
    sources = [s for s in DATA_SOURCES.values() if s.status == "active"]
    if source_type:
        sources = [s for s in sources if s.source_type == source_type]
    return sources


def get_court_sources(court_level: str | None = None) -> list[DataSource]:
    """Get all court data sources, optionally filtered by level."""
    sources = [s for s in DATA_SOURCES.values() if s.source_type == "court"]
    if court_level:
        sources = [s for s in sources if s.court_level == court_level]
    return sources


def get_social_sources() -> list[DataSource]:
    """Get all social media data sources."""
    return [s for s in DATA_SOURCES.values() if s.source_type == "social"]


def get_archive_sources() -> list[DataSource]:
    """Get all archive/aggregator data sources."""
    return [s for s in DATA_SOURCES.values() if s.source_type in ("archive", "aggregator")]


def print_source_summary():
    """Print a summary of all data sources."""
    print("\n" + "=" * 70)
    print("PAKISTANI LEGAL DATA SOURCES")
    print("=" * 70)

    for source_type in ["court", "law", "archive", "aggregator", "social"]:
        sources = [s for s in DATA_SOURCES.values() if s.source_type == source_type]
        if not sources:
            continue

        print(f"\n{source_type.upper()} SOURCES:")
        print("-" * 50)
        for s in sources:
            status_icon = {"active": "✓", "blocked": "✗", "login_required": "🔐", "archived": "📦"}.get(s.status, "?")
            print(f"  {status_icon} {s.name:30s} | {s.access_method:12s} | {s.rate_limit:5.1f}s delay")
            if s.notes:
                print(f"    └─ {s.notes[:60]}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    print_source_summary()
