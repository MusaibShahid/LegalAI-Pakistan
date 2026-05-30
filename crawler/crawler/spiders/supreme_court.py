import scrapy
from crawler.items import LegalDocumentItem
from crawler.spiders.base import BaseLegalSpider


class SupremeCourtSpider(BaseLegalSpider):
    """Spider for Supreme Court of Pakistan judgments.

    Judgment search: https://www.supremecourt.gov.pk/judgement-search/
    (likely POST-based — use Playwright scraper for interactive search)
    Static judgment listing: https://www.supremecourt.gov.pk/judgments/
    """

    name = "supreme_court"
    source_name = "supreme_court"
    allowed_domains = ["supremecourt.gov.pk", "scp.gov.pk"]
    start_urls = [
        "https://www.supremecourt.gov.pk/judgments/",
    ]

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.supremecourt.gov.pk/",
    }

    def parse(self, response):
        """Parse judgment listing pages and follow links."""
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
        """Parse an individual judgment page using base spider."""
        if response.url.lower().endswith(".pdf"):
            return

        item = self.build_judgment_item(response)
        item["court"] = "Supreme Court of Pakistan"
        yield item
