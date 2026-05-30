import scrapy
from crawler.items import LegalDocumentItem
from crawler.spiders.base import BaseLegalSpider


class SindhHighCourtSpider(BaseLegalSpider):
    """Spider for Sindh High Court judgments.

    Primary source: https://caselaw.shc.gov.pk/caselaw/public/home
    (JS-heavy search interface — use Playwright scraper for interactive search)
    """

    name = "sindh_high_court"
    source_name = "sindh_high_court"
    allowed_domains = [
        "sindhhighcourt.gov.pk",
        "caselaw.shc.gov.pk",
        "cases.shc.gov.pk",
    ]
    start_urls = [
        "https://caselaw.shc.gov.pk/caselaw/public/home",
        "https://www.sindhhighcourt.gov.pk/",
    ]

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://caselaw.shc.gov.pk/",
    }

    def parse(self, response):
        """Parse caselaw portal and main site for judgment links."""
        for href in response.css(self.JUDGMENT_LINK_SELECTORS).getall():
            if href and self.should_follow_link(href):
                yield scrapy.Request(
                    url=response.urljoin(href),
                    callback=self.parse_judgment,
                )

    def parse_judgment(self, response):
        """Parse an individual judgment page using base spider."""
        if response.url.lower().endswith(".pdf"):
            return

        item = self.build_judgment_item(response)
        item["court"] = "Sindh High Court"
        yield item
