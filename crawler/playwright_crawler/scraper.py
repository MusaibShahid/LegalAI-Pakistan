"""
Playwright-based scraper for legal sources that require JavaScript rendering.

Some Pakistani legal websites use JavaScript-heavy interfaces (e.g., search forms,
dynamic content loading). This module handles those cases where Scrapy alone
is insufficient.

Usage:
    python -m crawler.playwright_crawler.scraper --source supreme_court --search "2024"
"""

import asyncio
import json
import logging
from typing import Optional
from dataclasses import dataclass, field, asdict

from crawler.sources import ALL_SOURCES

logger = logging.getLogger(__name__)


@dataclass
class ScrapedDocument:
    source: str
    url: str
    title: str = ""
    citation: str = ""
    court: str = ""
    judge: str = ""
    date: str = ""
    case_number: str = ""
    full_text: str = ""
    pdf_url: Optional[str] = None
    raw_html: str = ""


class LegalPlaywrightScraper:
    """Playwright-based scraper for legal sources."""

    def __init__(self, headless: bool = True):
        self.headless = headless

    async def scrape_source(
        self,
        source: str,
        search_url: str,
        search_query: str = "",
    ) -> list[ScrapedDocument]:
        """Scrape a legal source using Playwright."""
        from playwright.async_api import async_playwright

        documents = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()

            try:
                await page.goto(search_url, wait_until="networkidle", timeout=30000)

                # Fill search form if query provided
                if search_query:
                    search_input = await page.query_selector(
                        "input[type='search'], input[name='q'], "
                        "input[name='search'], input[placeholder*='search' i]"
                    )
                    if search_input:
                        await search_input.fill(search_query)
                        await search_input.press("Enter")
                        await page.wait_for_timeout(3000)

                # Wait for results to load
                await page.wait_for_timeout(2000)

                # Extract document links
                doc_links = await page.query_selector_all(
                    "a[href*='.pdf'], a[href*='judgment'], "
                    "a[href*='judgement'], a[href*='case'], "
                    "a[href*='view'], a[href*='detail']"
                )

                urls = set()
                for link in doc_links:
                    href = await link.get_attribute("href")
                    if href and not href.startswith("#"):
                        full_url = href if href.startswith("http") else \
                            f"{search_url.rstrip('/')}/{href.lstrip('/')}"
                        urls.add(full_url)

                # Visit each document page
                for url in list(urls)[:50]:  # Limit to 50 per run
                    try:
                        doc = await self._scrape_document_page(
                            browser, url, source
                        )
                        if doc:
                            documents.append(doc)
                    except Exception as e:
                        logger.warning(f"Failed to scrape {url}: {e}")

            finally:
                await browser.close()

        return documents

    async def _scrape_document_page(
        self,
        browser,
        url: str,
        source: str,
    ) -> Optional[ScrapedDocument]:
        """Scrape an individual document page."""
        from playwright.async_api import async_playwright

        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=20000)

            doc = ScrapedDocument(
                source=source,
                url=url,
                title=await self._get_text(page, "h1"),
                citation=await self._get_text(page, ".citation"),
                court=source.replace("_", " ").title(),
                date=await self._get_text(page, ".date, time, .judgment-date"),
                case_number=await self._get_text(page, ".case-number, .case-no"),
                full_text=await self._get_text(page, "article, .content, .judgment-text"),
                raw_html=await page.content(),
            )

            # Try to find PDF link
            pdf_link = await page.query_selector("a[href$='.pdf']")
            if pdf_link:
                doc.pdf_url = await pdf_link.get_attribute("href")

            return doc

        finally:
            await page.close()

    async def _get_text(self, page, selector: str) -> str:
        """Get text content from a page element."""
        try:
            element = await page.query_selector(selector)
            if element:
                text = await element.inner_text()
                return text.strip()
        except Exception:
            pass
        return ""

    def save_documents(self, documents: list[ScrapedDocument], output_path: str):
        """Save scraped documents to JSON."""
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump([asdict(d) for d in documents], f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(documents)} documents to {output_path}")


# Sources that require Playwright for JS-heavy search interfaces
PLAYWRIGHT_SOURCES = {
    s.id: {"url": s.search_url, "domain": s.domain, "description": s.description}
    for s in ALL_SOURCES
    if s.source_type == "playwright"
}


async def main():
    """CLI entry point for Playwright scraper."""
    import argparse

    parser = argparse.ArgumentParser(description="Scrape legal sources with Playwright")
    parser.add_argument(
        "--source",
        required=True,
        choices=list(PLAYWRIGHT_SOURCES.keys()),
        help=f"Source name: {', '.join(PLAYWRIGHT_SOURCES.keys())}",
    )
    parser.add_argument("--url", default=None, help="Override default source URL")
    parser.add_argument("--query", default="", help="Search query")
    parser.add_argument("--output", default="scraped_documents.json", help="Output JSON path")
    args = parser.parse_args()

    source_info = PLAYWRIGHT_SOURCES[args.source]
    search_url = args.url or source_info["url"]

    print(f"Scraping {args.source} from {search_url}")
    print(f"Source info: {source_info['description']}")

    scraper = LegalPlaywrightScraper()
    documents = await scraper.scrape_source(
        source=args.source,
        search_url=search_url,
        search_query=args.query,
    )
    scraper.save_documents(documents, args.output)
    print(f"Done. Scraped {len(documents)} documents.")


if __name__ == "__main__":
    asyncio.run(main())
