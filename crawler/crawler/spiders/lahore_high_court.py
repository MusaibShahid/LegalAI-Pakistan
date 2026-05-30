import scrapy
from crawler.items import LegalDocumentItem
from crawler.spiders.base import BaseLegalSpider


class LahoreHighCourtSpider(BaseLegalSpider):
    """Spider for Lahore High Court reported judgments.

    Primary source: https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting
    Uses a table-based listing with pagination.
    """

    name = "lahore_high_court"
    source_name = "lahore_high_court"
    allowed_domains = ["data.lhc.gov.pk", "lhc.gov.pk"]
    start_urls = [
        "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
    ]

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://data.lhc.gov.pk/",
    }

    def parse(self, response):
        """Parse the reported judgments listing page."""
        for href in response.css(self.JUDGMENT_LINK_SELECTORS).getall():
            if href and self.should_follow_link(href):
                yield scrapy.Request(
                    url=response.urljoin(href),
                    callback=self.parse_judgment,
                )

        # Follow pagination
        next_page = response.css(self.PAGINATION_SELECTORS).get()
        if next_page:
            yield scrapy.Request(
                url=response.urljoin(next_page),
                callback=self.parse,
            )

    def parse_judgment(self, response):
        """Parse an individual judgment page or PDF link."""
        if response.url.lower().endswith(".pdf"):
            yield LegalDocumentItem(
                source=self.source_name,
                external_id=response.url.split("/")[-1].split(".")[0],
                url=response.url,
                title="",  # Will be filled from referring page metadata
                citation="",
                court="Lahore High Court",
                bench="",
                judge="",
                date="",
                case_number="",
                full_text="",
                description="",
                sections_referenced=[],
                pdf_url=response.url,
                raw_html="",
            )
            return

        item = self.build_judgment_item(response)
        item["court"] = "Lahore High Court"
        yield item
