import scrapy
from urllib.parse import urljoin
from typing import Optional
from crawler.items import LegalDocumentItem


class BaseLegalSpider(scrapy.Spider):
    """Base spider with common methods and CSS selectors for legal source scraping."""

    source_name: str = "unknown"
    allowed_domains: list[str] = []
    start_urls: list[str] = []
    custom_headers: dict[str, str] = {}

    # ── Common CSS Selectors (shared across spiders) ──────────────────

    # Links to judgment/case detail pages
    JUDGMENT_LINK_SELECTORS = (
        "a[href*='judgment']::attr(href), "
        "a[href*='judgement']::attr(href), "
        "a[href*='case']::attr(href), "
        "a[href*='.pdf']::attr(href), "
        "a[href*='view']::attr(href), "
        "a[href*='detail']::attr(href), "
        "a[href*='download']::attr(href), "
        ".judgment-list a::attr(href), "
        ".judgments a::attr(href), "
        "table a::attr(href), "
        ".table a::attr(href), "
        ".list a::attr(href), "
        ".content a::attr(href)"
    )

    # Title selectors
    TITLE_SELECTORS = (
        "h1, .judgment-title, .entry-title, "
        ".case-title, .post-title, .heading, "
        ".table-bordered h2, .panel-heading"
    )

    # Citation selectors
    CITATION_SELECTORS = (
        ".citation, .case-citation, "
        ".judgment-citation, .case-ref, .reference"
    )

    # Court/bench selectors
    BENCH_SELECTORS = ".bench, .court-bench, .bench-details"
    JUDGE_SELECTORS = (
        ".judge, .presiding-judge, .author, "
        ".judgment-author, .judge-name"
    )

    # Date selectors
    DATE_SELECTORS = ".date, .judgment-date, time, .post-date, .case-date"

    # Case number selectors
    CASE_NUMBER_SELECTORS = (
        ".case-number, .case-no, .case-details, "
        ".case-id, .case-no-field, .case-id-field"
    )

    # Full text selectors
    FULL_TEXT_SELECTORS = (
        ".judgment-text, .entry-content, article, "
        ".judgment-body, .post-content, "
        ".content-area, main, .panel-body"
    )

    # PDF link selectors
    PDF_LINK_SELECTORS = (
        "a[href$='.pdf']::attr(href), "
        "a[href*='.pdf?']::attr(href), "
        "a[href*='download']::attr(href), "
        "a[href*='getFile']::attr(href)"
    )

    # Pagination selectors
    PAGINATION_SELECTORS = (
        "a.next::attr(href), a.next-page::attr(href), "
        ".pagination a.next::attr(href), "
        "a[rel='next']::attr(href), "
        ".next a::attr(href)"
    )

    # ── Shared Methods ───────────────────────────────────────────────

    def parse_judgment(self, response):
        """Default judgment parser. Override in source-specific spiders."""
        raise NotImplementedError

    def extract_text_safe(self, response, css_selector: str, default: str = "") -> str:
        """Safely extract text from a CSS selector."""
        parts = response.css(f"{css_selector}::text").getall()
        return " ".join(p.strip() for p in parts if p.strip()) if parts else default

    def extract_attr_safe(self, response, css_selector: str, attr: str = "href", default: str = "") -> str:
        """Safely extract an attribute from a CSS selector."""
        val = response.css(css_selector).get()
        return val.strip() if val else default

    def make_absolute(self, base_url: str, relative_url: str) -> str:
        """Convert relative URL to absolute."""
        return urljoin(base_url, relative_url)

    def should_follow_link(self, url: str) -> bool:
        """Determine if a URL should be followed."""
        skip_patterns = [
            "javascript:", "mailto:", "tel:", "#",
            ".jpg", ".png", ".gif", ".zip",
        ]
        return not any(pattern in url.lower() for pattern in skip_patterns)

    def build_judgment_item(self, response) -> LegalDocumentItem:
        """Build a standard LegalDocumentItem from common selectors."""
        return LegalDocumentItem(
            source=self.source_name,
            external_id=response.url.split("/")[-1].split(".")[0].split("?")[0],
            url=response.url,
            title=self.extract_text_safe(response, self.TITLE_SELECTORS),
            citation=self.extract_text_safe(response, self.CITATION_SELECTORS),
            court="",  # Set in source-specific spider
            bench=self.extract_text_safe(response, self.BENCH_SELECTORS),
            judge=self.extract_text_safe(response, self.JUDGE_SELECTORS),
            date=self.extract_text_safe(response, self.DATE_SELECTORS),
            case_number=self.extract_text_safe(response, self.CASE_NUMBER_SELECTORS),
            full_text=self.extract_text_safe(response, self.FULL_TEXT_SELECTORS),
            description="",
            sections_referenced=[],
            pdf_url=self.extract_attr_safe(response, self.PDF_LINK_SELECTORS),
            raw_html=response.text,
        )
