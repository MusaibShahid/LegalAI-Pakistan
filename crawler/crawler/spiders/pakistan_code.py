import scrapy
from crawler.items import LawSectionItem
from crawler.spiders.base import BaseLegalSpider


class PakistanCodeSpider(BaseLegalSpider):
    """Spider for Pakistan Code — official repository of federal statutes.

    Navigates the law listings available in three views:
    - Alphabetical: https://pakistancode.gov.pk/english/LGu0xAD.php
    - Chronological: https://pakistancode.gov.pk/english/LGu0xBD.php
    - Category: https://pakistancode.gov.pk/english/LGu0xVD.php

    Each law page contains sections with their text content.
    """

    name = "pakistan_code"
    source_name = "pakistan_code"
    allowed_domains = ["pakistancode.gov.pk"]
    start_urls = [
        "https://pakistancode.gov.pk/english/LGu0xAD.php",   # Alphabetical
        "https://pakistancode.gov.pk/english/LGu0xBD.php",   # Chronological
        "https://pakistancode.gov.pk/english/LGu0xVD.php",   # Category
    ]

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://pakistancode.gov.pk/",
    }

    def parse(self, response):
        """Parse law listing pages — extract links to individual laws."""
        # Extract law links — Pakistani Code uses anchor tags with specific patterns
        law_links = response.css(
            "a[href*='Law'], a[href*='law'], "
            "a[href*='Act'], a[href*='act'], "
            "a[href*='Ord'], a[href*='ord'], "
            ".law-list a, .act-list a, "
            "table a, ul.list a, .content-area a"
        )
        for link in law_links:
            href = link.attrib.get("href", "")
            text = link.css("::text").get("").strip()
            if href and text and self.should_follow_link(href):
                # Skip navigation/utility links
                if any(skip in href.lower() for skip in ["javascript", "mailto", "#"]):
                    continue
                yield scrapy.Request(
                    url=response.urljoin(href),
                    callback=self.parse_law_page,
                    meta={"law_name": text},
                )

    def parse_law_page(self, response):
        """Parse an individual law page to extract section details.

        Pakistan Code law pages typically have:
        - The law name in the page title / heading
        - Section numbers as numbered headings or list items
        - Section text following each section number
        """
        law_name = response.meta.get(
            "law_name",
            self.extract_text_safe(response, "h1, .law-title, .act-title, .heading"),
        )

        # Try to find individual sections
        sections = response.css(
            ".section, .law-section, .act-section, "
            ".section-content, .content-block, "
            "article, .main-content"
        )

        if sections:
            for section in sections:
                section_number = section.css(
                    ".section-number::text, .sec-no::text, "
                    "h2::text, h3::text, strong::text"
                ).get("").strip()

                section_text = " ".join(
                    section.css("::text").getall()
                ).strip()

                if section_number or section_text:
                    yield LawSectionItem(
                        source=self.source_name,
                        external_id=f"{response.url}#{section_number}",
                        url=response.url,
                        law_name=law_name or "Unknown Law",
                        section_number=section_number,
                        section_text=section_text or "N/A",
                        related_sections=[],
                        source_url=response.url,
                        raw_html=response.text,
                    )
        else:
            # Fallback: yield the whole page content as a single section
            content = self.extract_text_safe(
                response,
                ".content, .law-content, .act-content, "
                ".main-content, article, body",
            )
            if content:
                yield LawSectionItem(
                    source=self.source_name,
                    external_id=response.url.split("/")[-1].split(".")[0],
                    url=response.url,
                    law_name=law_name or "Unknown Law",
                    section_number="General",
                    section_text=content,
                    related_sections=[],
                    source_url=response.url,
                    raw_html=response.text,
                )
