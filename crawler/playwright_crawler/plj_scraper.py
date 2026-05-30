"""
PLJ Law Site Scraper (Playwright-based).

Requires PLJ subscription credentials.
Set environment variables:
  PLJ_USERNAME - your PLJ login email
  PLJ_PASSWORD - your PLJ password

Usage:
  python -m crawler.playwright_crawler.plj_scraper --book PLJ --court "Supreme Court" --year 2024 --page 1
"""

import asyncio
import json
import logging
import os
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path

from playwright.async_api import async_playwright, Page, Browser

logger = logging.getLogger(__name__)

PLJ_BASE_URL = "https://www.pljlawsite.com"
PLJ_LOGIN_URL = f"{PLJ_BASE_URL}/login.asp"
PLJ_CITATION_URL = f"{PLJ_BASE_URL}/citationsearch.asp"
PLJ_CASELAW_URL = f"{PLJ_BASE_URL}/caselawsearch.asp"

COURT_MAP = {
    "Supreme Court": "Supreme Court",
    "Supreme Court (Criminal)": "Supreme Court (Criminal)",
    "Lahore High Court": "Lahore High Court",
    "Karachi High Court": "Karachi High Court",
    "Peshawar High Court": "Peshawar High Court",
    "Quetta High Court": "Quetta High Court",
    "Islamabad High Court": "Islamabad High Court",
    "Tribunal Cases": "Tribunal Cases",
    "AJ&K Court": "AJ&K Court",
    "SC-AJ&K": "SC-AJ&K",
    "Sh.C-AJ&K": "Sh.C-AJ&K",
    "Tax Cases": "Tax Cases",
    "FSC": "FSC",
    "Cr.C": "Cr.C",
    "Law Note (Civil)": "Law Note (Civil)",
    "Law Note (Criminal)": "Law Note (Criminal)",
}

BOOK_OPTIONS = ["PLJ", "CLC", "MLD", "YLR", "PCrLJ", "SCR", "SCMR", "PLD"]


@dataclass
class PLJCitationResult:
    """A single citation search result from PLJ."""
    book_name: str = ""
    court_name: str = ""
    year: str = ""
    page_number: str = ""
    citation: str = ""
    title: str = ""
    parties: str = ""
    judgment_date: str = ""
    judge: str = ""
    sections: list[str] = field(default_factory=list)
    source_url: str = ""
    pdf_url: str = ""


class PLJScraper:
    """Playwright-based scraper for PLJ Law Site citation search."""

    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self._logged_in = False

    async def start(self):
        """Launch browser and create a page."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()
        logger.info("PLJ scraper browser launched")

    async def close(self):
        """Close browser."""
        if self.browser:
            await self.browser.close()
            logger.info("PLJ scraper browser closed")

    async def login(self) -> bool:
        """Log in to PLJ Law Site."""
        if self._logged_in:
            return True

        try:
            await self.page.goto(PLJ_LOGIN_URL, wait_until="networkidle", timeout=30000)

            # Fill login form
            await self.page.fill('input[name="username"], input[name="UserName"], input[type="text"]', self.username)
            await self.page.fill('input[name="password"], input[name="Password"], input[type="password"]', self.password)

            # Click login button
            await self.page.click('input[type="submit"], button[type="submit"]')
            await self.page.wait_for_load_state("networkidle", timeout=15000)

            # Check if login succeeded (look for logout link or user menu)
            content = await self.page.content()
            if "logout" in content.lower() or "welcome" in content.lower() or "username" in content.lower():
                self._logged_in = True
                logger.info("PLJ login successful")
                return True
            else:
                logger.error("PLJ login failed - no logout link found")
                return False

        except Exception as e:
            logger.error("PLJ login error: %s", e)
            return False

    async def search_citations(
        self,
        book_name: str = "PLJ",
        court_name: str = "",
        year: str = "",
        page_number: str = "",
    ) -> list[PLJCitationResult]:
        """Search PLJ citation database."""
        if not await self.login():
            return []

        results = []

        try:
            await self.page.goto(PLJ_CITATION_URL, wait_until="networkidle", timeout=30000)

            # Select book name
            if book_name:
                try:
                    await self.page.select_option('select[name="bookname"], select[name="BookName"]', book_name)
                except Exception:
                    pass

            # Select court name
            if court_name:
                court_value = COURT_MAP.get(court_name, court_name)
                try:
                    await self.page.select_option('select[name="courtname"], select[name="CourtName"]', court_value)
                except Exception:
                    pass

            # Fill year
            if year:
                try:
                    await self.page.fill('input[name="year"], input[name="Year"]', year)
                except Exception:
                    pass

            # Fill page number
            if page_number:
                try:
                    await self.page.fill('input[name="pageno"], input[name="PageNo"]', page_number)
                except Exception:
                    pass

            # Click search button
            await self.page.click('input[type="submit"], button[type="submit"], input[value="Index Search"]')
            await self.page.wait_for_load_state("networkidle", timeout=15000)

            # Parse results
            content = await self.page.content()
            results = self._parse_citation_results(content)

            logger.info("PLJ citation search returned %d results", len(results))

        except Exception as e:
            logger.error("PLJ citation search error: %s", e)

        return results

    def _parse_citation_results(self, html: str) -> list[PLJCitationResult]:
        """Parse citation search results from HTML."""
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        results = []

        # Look for result tables or divs
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all(["td", "th"])
                if len(cells) >= 3:
                    result = PLJCitationResult()
                    result.citation = cells[0].get_text(strip=True)
                    result.title = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    result.parties = cells[2].get_text(strip=True) if len(cells) > 2 else ""

                    # Extract link if present
                    link = row.find("a")
                    if link and link.get("href"):
                        result.source_url = f"{PLJ_BASE_URL}/{link['href']}".replace("//", "/")

                    if result.citation:
                        results.append(result)

        return results

    async def search_caselaw(
        self,
        query: str,
        court_name: str = "",
        year_from: str = "",
        year_to: str = "",
    ) -> list[PLJCitationResult]:
        """Search PLJ case law database."""
        if not await self.login():
            return []

        results = []

        try:
            await self.page.goto(PLJ_CASELAW_URL, wait_until="networkidle", timeout=30000)

            # Fill search query
            try:
                await self.page.fill('input[name="search"], input[name="q"], textarea[name="search"]', query)
            except Exception:
                pass

            # Select court
            if court_name:
                court_value = COURT_MAP.get(court_name, court_name)
                try:
                    await self.page.select_option('select[name="courtname"], select[name="CourtName"]', court_value)
                except Exception:
                    pass

            # Click search
            await self.page.click('input[type="submit"], button[type="submit"]')
            await self.page.wait_for_load_state("networkidle", timeout=15000)

            content = await self.page.content()
            results = self._parse_citation_results(content)

            logger.info("PLJ case law search returned %d results", len(results))

        except Exception as e:
            logger.error("PLJ case law search error: %s", e)

        return results


async def main():
    """CLI entry point for PLJ scraper."""
    import argparse

    parser = argparse.ArgumentParser(description="PLJ Law Site Scraper")
    parser.add_argument("--book", default="PLJ", choices=BOOK_OPTIONS, help="Book name")
    parser.add_argument("--court", default="", help="Court name")
    parser.add_argument("--year", default="", help="Year")
    parser.add_argument("--page", default="", help="Page number")
    parser.add_argument("--query", default="", help="Search query for case law")
    parser.add_argument("--output", default="plj_results.json", help="Output file")
    args = parser.parse_args()

    username = os.environ.get("PLJ_USERNAME", "")
    password = os.environ.get("PLJ_PASSWORD", "")

    if not username or not password:
        print("Error: Set PLJ_USERNAME and PLJ_PASSWORD environment variables")
        return

    scraper = PLJScraper(username, password)
    await scraper.start()

    try:
        if args.query:
            results = await scraper.search_caselaw(args.query, args.court)
        else:
            results = await scraper.search_citations(args.book, args.court, args.year, args.page)

        # Save results
        output_data = [
            {
                "citation": r.citation,
                "title": r.title,
                "parties": r.parties,
                "court": r.court_name,
                "year": r.year,
                "judge": r.judge,
                "source_url": r.source_url,
            }
            for r in results
        ]

        with open(args.output, "w") as f:
            json.dump(output_data, f, indent=2)

        print(f"Saved {len(results)} results to {args.output}")

    finally:
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
