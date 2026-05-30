"""
Playwright-based scraper for Supreme Court of Pakistan Portal (scp.gov.pk).

This script scrapes the Latest Judgments page and extracts:
- Case Subject
- Case Number
- Case Title
- Author Judge
- Judgment Date
- Upload Date
- Citation
- SC Citation
- PDF Download Link

Usage:
    python scp_scraper.py [--output JSON_FILE] [--limit N]
"""

import asyncio
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from playwright.async_api import async_playwright, Page
except ImportError:
    print("Error: playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)


class SCPScraper:
    """Scraper for Supreme Court of Pakistan Portal."""

    BASE_URL = "https://scp.gov.pk"
    LATEST_JUDGMENTS_URL = "https://scp.gov.pk/LatestJudgments"

    def __init__(self):
        self.judgments = []

    async def scrape_latest_judgments(self, page: Page, limit: Optional[int] = None) -> list[dict]:
        """Scrape the Latest Judgments page."""
        print(f"Navigating to {self.LATEST_JUDGMENTS_URL}...")
        await page.goto(self.LATEST_JUDGMENTS_URL, wait_until="networkidle", timeout=60000)

        # Wait for the table to load
        await page.wait_for_selector("table", timeout=30000)

        # Get all table rows
        rows = await page.query_selector_all("table tr")

        judgments = []
        for i, row in enumerate(rows):
            # Skip header row
            if i == 0:
                continue

            cells = await row.query_selector_all("td")
            if len(cells) < 9:
                continue

            # Extract text from each cell
            sr_no = await cells[0].inner_text()
            case_subject = await cells[1].inner_text()
            case_no = await cells[2].inner_text()
            case_title = await cells[3].inner_text()
            author_judge = await cells[4].inner_text()
            judgment_date = await cells[5].inner_text()
            upload_date = await cells[6].inner_text()
            citation = await cells[7].inner_text()
            sc_citation = await cells[8].inner_text()

            # Get PDF link
            pdf_url = ""
            if len(cells) > 9:
                link = await cells[9].query_selector("a")
                if link:
                    pdf_url = await link.get_attribute("href") or ""
                    if pdf_url and not pdf_url.startswith("http"):
                        pdf_url = f"{self.BASE_URL}{pdf_url}"

            # Clean up text
            sr_no = sr_no.strip()
            if not sr_no or not sr_no.isdigit():
                continue

            judgment = {
                "sr_no": sr_no,
                "case_subject": case_subject.strip(),
                "case_number": case_no.strip(),
                "case_title": case_title.strip(),
                "author_judge": author_judge.strip(),
                "judgment_date": judgment_date.strip(),
                "upload_date": upload_date.strip(),
                "citation": citation.strip(),
                "sc_citation": sc_citation.strip(),
                "pdf_url": pdf_url,
                "source_url": self.LATEST_JUDGMENTS_URL,
                "scraped_at": datetime.now().isoformat(),
            }

            judgments.append(judgment)
            print(f"  [{sr_no}] {case_title[:60]}...")

            if limit and len(judgments) >= limit:
                break

        self.judgments = judgments
        return judgments

    def save_to_json(self, output_path: str):
        """Save scraped judgments to JSON file."""
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.judgments, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(self.judgments)} judgments to {output_path}")

    def save_to_database(self, db_path: str):
        """Save judgments to SQLite database for the backend."""
        import sqlite3

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scp_latest_judgments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sr_no TEXT,
                case_subject TEXT,
                case_number TEXT UNIQUE,
                case_title TEXT,
                author_judge TEXT,
                judgment_date TEXT,
                upload_date TEXT,
                citation TEXT,
                sc_citation TEXT,
                pdf_url TEXT,
                source_url TEXT,
                scraped_at TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        for judgment in self.judgments:
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO scp_latest_judgments 
                    (sr_no, case_subject, case_number, case_title, author_judge,
                     judgment_date, upload_date, citation, sc_citation, pdf_url,
                     source_url, scraped_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    judgment["sr_no"],
                    judgment["case_subject"],
                    judgment["case_number"],
                    judgment["case_title"],
                    judgment["author_judge"],
                    judgment["judgment_date"],
                    judgment["upload_date"],
                    judgment["citation"],
                    judgment["sc_citation"],
                    judgment["pdf_url"],
                    judgment["source_url"],
                    judgment["scraped_at"],
                ))
            except Exception as e:
                print(f"  Error inserting {judgment['case_number']}: {e}")

        conn.commit()
        conn.close()
        print(f"Saved {len(self.judgments)} judgments to database: {db_path}")


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Scrape SCP Latest Judgments")
    parser.add_argument("--output", "-o", default="scp_judgments.json", help="Output JSON file")
    parser.add_argument("--limit", "-l", type=int, default=None, help="Limit number of judgments")
    parser.add_argument("--database", "-d", default=None, help="SQLite database path")
    parser.add_argument("--headless", action="store_true", default=True, help="Run in headless mode")
    args = parser.parse_args()

    scraper = SCPScraper()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=args.headless)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        page = await context.new_page()

        try:
            judgments = await scraper.scrape_latest_judgments(page, limit=args.limit)
            print(f"\nScraped {len(judgments)} judgments from SCP portal")

            # Save to JSON
            scraper.save_to_json(args.output)

            # Save to database if specified
            if args.database:
                scraper.save_to_database(args.database)

        except Exception as e:
            print(f"Error during scraping: {e}")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
