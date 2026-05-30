#!/usr/bin/env python3
"""
Constitution of Pakistan crawler - standalone script.

Crawls all articles from pakistani.org/pakistan/constitution/
and stores them in the PLSE database as LawSection items.

Usage:
    python crawl_constitution.py
"""

import asyncio
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

# ── Configuration ──────────────────────────────────────────────

BASE_URL = "https://www.pakistani.org/pakistan/constitution"
DB_PATH = Path(__file__).parent.parent / "backend" / "plse.db"
CONCURRENCY = 4  # concurrent requests
DELAY = 1.0  # seconds between batches

# ── All pages to crawl ─────────────────────────────────────────

PART_PAGES = [
    ("preamble", "Preamble", None),
    ("part1", "Part I", "Introductory"),
    ("part2.ch1", "Part II", "Chapter 1: Fundamental Rights"),
    ("part2.ch2", "Part II", "Chapter 2: Principles of Policy"),
    ("part3.ch1", "Part III", "Chapter 1: The President"),
    ("part3.ch2", "Part III", "Chapter 2: Majlis-e-Shoora (Parliament)"),
    ("part3.ch3", "Part III", "Chapter 3: The Federal Government"),
    ("part4.ch1", "Part IV", "Chapter 1: The Governors"),
    ("part4.ch2", "Part IV", "Chapter 2: Provincial Assemblies"),
    ("part4.ch3", "Part IV", "Chapter 3: The Provincial Governments"),
    ("part5.ch1", "Part V", "Chapter 1: Distribution of Legislative Powers"),
    ("part5.ch2", "Part V", "Chapter 2: Administrative Relations"),
    ("part5.ch3", "Part V", "Chapter 3: Special Provisions"),
    ("part6.ch1", "Part VI", "Chapter 1: Finance"),
    ("part6.ch2", "Part VI", "Chapter 2: Borrowing and Audit"),
    ("part6.ch3", "Part VI", "Chapter 3: Property, Contracts, Liabilities and Suits"),
    ("part7.ch1", "Part VII", "Chapter 1: The Courts"),
    ("part7.ch1A", "Part VII", "Chapter 1A: The Federal Constitutional Court"),
    ("part7.ch2", "Part VII", "Chapter 2: The Supreme Court"),
    ("part7.ch3", "Part VII", "Chapter 3: The High Courts"),
    ("part7.ch3A", "Part VII", "Chapter 3A: Federal Shariat Court"),
    ("part7.ch4", "Part VII", "Chapter 4: General Provisions Relating to Judicature"),
    ("part8.ch1", "Part VIII", "Chapter 1: Chief Election Commissioner"),
    ("part8.ch2", "Part VIII", "Chapter 2: Electoral Laws and the Conduct of Elections"),
    ("part9", "Part IX", "Islamic Provisions"),
    ("part10", "Part X", "Emergency Provisions"),
    ("part11", "Part XI", "Amendment of Constitution"),
    ("part12.ch1", "Part XII", "Chapter 1: Services"),
    ("part12.ch2", "Part XII", "Chapter 2: Armed Forces"),
    ("part12.ch3", "Part XII", "Chapter 3: Tribal Areas"),
    ("part12.ch4", "Part XII", "Chapter 4: General"),
    ("part12.ch5", "Part XII", "Chapter 5: Interpretation"),
    ("part12.ch6", "Part XII", "Chapter 6: Title, Commencement and Repeal"),
    ("part12.ch7", "Part XII", "Chapter 7: Transitional"),
    ("annex_objres", "Annex", "Objectives Resolution"),
]

SCHEDULE_PAGES = [
    ("schedule1", "First Schedule"),
    ("schedule2", "Second Schedule"),
    ("schedule3", "Third Schedule"),
    ("schedule4", "Fourth Schedule"),
    ("schedule5", "Fifth Schedule"),
]

AMENDMENT_PAGES = list(range(1, 22))  # 1st through 21st Amendment


# ── Parsing ────────────────────────────────────────────────────

def ordinal(n: int) -> str:
    if 11 <= n % 100 <= 13:
        suffix = "th"
    elif n % 10 == 1:
        suffix = "st"
    elif n % 10 == 2:
        suffix = "nd"
    elif n % 10 == 3:
        suffix = "rd"
    else:
        suffix = "th"
    return f"{n}{suffix}"


def extract_articles(html: str, page_key: str) -> list[dict]:
    """Extract individual articles from a constitution page."""
    soup = BeautifulSoup(html, "lxml")
    articles = []

    # Find all table rows that contain articles
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) < 2:
                continue

            first_cell = cells[0]
            second_cell = cells[1]

            # Check if first cell has a bold article number
            bold = first_cell.find("b")
            if not bold:
                continue
            article_num = bold.get_text(strip=True)

            # Must look like an article number (digits, possibly with letter suffix)
            if not re.match(r'^\d+[A-Za-z]*$', article_num):
                continue

            # Extract article title from second cell's <b> tag
            title_bold = second_cell.find("b")
            article_title = title_bold.get_text(strip=True) if title_bold else ""

            # Extract full text from second cell
            # Get all text, removing the title
            full_text = second_cell.get_text(separator="\n", strip=True)
            if article_title and full_text.startswith(article_title):
                full_text = full_text[len(article_title):].strip()

            # Clean up whitespace
            full_text = re.sub(r'\n{3,}', '\n\n', full_text)
            full_text = re.sub(r' {2,}', ' ', full_text)

            if article_num and (article_title or full_text):
                articles.append({
                    "number": article_num,
                    "title": article_title,
                    "text": full_text,
                })

    return articles


def extract_page_text(html: str) -> str:
    """Extract clean text from a page (for preamble, schedules, amendments)."""
    soup = BeautifulSoup(html, "lxml")

    # Remove navigation elements
    for tag in soup.find_all(["form", "script", "style", "select"]):
        tag.decompose()

    # Get body text
    body = soup.find("body")
    if not body:
        return ""

    text = body.get_text(separator="\n", strip=True)

    # Remove the navigation "Go to:" section
    lines = text.split("\n")
    clean_lines = []
    skip = False
    for line in lines:
        if "Go to:" in line or "Select a Part" in line:
            skip = True
            continue
        if skip and line.strip() == "":
            skip = False
            continue
        if not skip:
            clean_lines.append(line)

    text = "\n".join(clean_lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ── Database ───────────────────────────────────────────────────

def init_db(db_path: Path) -> sqlite3.Connection:
    """Initialize database connection and create table if needed."""
    conn = sqlite3.connect(str(db_path))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS law_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT UNIQUE NOT NULL,
            law_name TEXT NOT NULL,
            section_number TEXT NOT NULL,
            section_text TEXT NOT NULL,
            related_sections TEXT DEFAULT '[]',
            related_judgments TEXT DEFAULT '[]',
            source_url TEXT NOT NULL,
            metadata_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_law_sections_law_name ON law_sections(law_name)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_law_sections_section_number ON law_sections(section_number)
    """)
    conn.commit()
    return conn


def insert_item(conn: sqlite3.Connection, item: dict) -> bool:
    """Insert a law section item into the database. Returns True if inserted."""
    try:
        conn.execute("""
            INSERT OR REPLACE INTO law_sections
            (external_id, law_name, section_number, section_text, related_sections, source_url, metadata_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            item["external_id"],
            item["law_name"],
            item["section_number"],
            item["section_text"],
            json.dumps(item.get("related_sections", [])),
            item["source_url"],
            json.dumps(item.get("metadata", {})),
        ))
        return True
    except sqlite3.IntegrityError:
        return False


# ── Crawler ────────────────────────────────────────────────────

async def fetch_page(client: httpx.AsyncClient, url: str) -> str | None:
    """Fetch a single page."""
    try:
        resp = await client.get(url, follow_redirects=True, timeout=30)
        if resp.status_code == 200:
            return resp.text
        else:
            print(f"  [WARN] {url} -> {resp.status_code}")
            return None
    except Exception as e:
        print(f"  [ERROR] {url} -> {e}")
        return None


async def crawl_constitution():
    """Main crawler function."""
    print("=" * 60)
    print("Constitution of Pakistan Crawler")
    print("=" * 60)

    # Initialize database
    db_path = DB_PATH
    if not db_path.parent.exists():
        print(f"[ERROR] Database directory not found: {db_path.parent}")
        sys.exit(1)

    conn = init_db(db_path)
    print(f"[DB] Connected to: {db_path}")

    # Build all URLs
    all_tasks = []

    # Part/Chapter pages
    for page_key, part, chapter in PART_PAGES:
        url = f"{BASE_URL}/{page_key}.html"
        all_tasks.append(("part", url, page_key, part, chapter))

    # Schedule pages
    for page_key, title in SCHEDULE_PAGES:
        url = f"{BASE_URL}/schedules/{page_key}.html"
        all_tasks.append(("schedule", url, page_key, title, None))

    # Amendment pages
    for num in AMENDMENT_PAGES:
        url = f"{BASE_URL}/amendments/{num}amendment.html"
        title = f"{ordinal(num)} Amendment"
        all_tasks.append(("amendment", url, f"amendment_{num}", title, None))

    print(f"[CRAWL] Total pages to fetch: {len(all_tasks)}")

    total_inserted = 0
    total_skipped = 0

    async with httpx.AsyncClient(
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        http2=True,
    ) as client:
        # Process in batches
        for i in range(0, len(all_tasks), CONCURRENCY):
            batch = all_tasks[i:i + CONCURRENCY]
            print(f"\n[BATCH {i // CONCURRENCY + 1}] Fetching {len(batch)} pages...")

            # Fetch all pages in batch concurrently
            fetch_tasks = []
            for task_type, url, key, part, chapter in batch:
                fetch_tasks.append(fetch_page(client, url))

            results = await asyncio.gather(*fetch_tasks)

            # Process results
            for (task_type, url, key, part, chapter), html in zip(batch, results):
                if not html:
                    total_skipped += 1
                    continue

                if task_type == "part":
                    # Extract individual articles
                    articles = extract_articles(html, key)
                    if articles:
                        for art in articles:
                            section_text = art["text"]
                            if art["title"]:
                                section_text = f"{art['title']}\n\n{art['text']}"

                            item = {
                                "external_id": f"pakistani_org_article_{art['number']}",
                                "law_name": "Constitution of Pakistan",
                                "section_number": f"Article {art['number']}",
                                "section_text": section_text,
                                "related_sections": [],
                                "source_url": url,
                                "metadata": {"part": part, "chapter": chapter},
                            }
                            if insert_item(conn, item):
                                total_inserted += 1
                            else:
                                total_skipped += 1

                        print(f"  [OK] {key}: {len(articles)} articles")
                    else:
                        # No articles found (e.g., preamble) - yield whole page
                        text = extract_page_text(html)
                        if text:
                            title = part
                            if chapter:
                                title = f"{part} - {chapter}"

                            item = {
                                "external_id": f"pakistani_org_{key}",
                                "law_name": "Constitution of Pakistan",
                                "section_number": title,
                                "section_text": text,
                                "related_sections": [],
                                "source_url": url,
                                "metadata": {"part": part, "chapter": chapter},
                            }
                            if insert_item(conn, item):
                                total_inserted += 1
                            else:
                                total_skipped += 1
                            print(f"  [OK] {key}: whole page text")

                elif task_type == "schedule":
                    text = extract_page_text(html)
                    if text:
                        item = {
                            "external_id": f"pakistani_org_{key}",
                            "law_name": "Constitution of Pakistan",
                            "section_number": part,
                            "section_text": text,
                            "related_sections": [],
                            "source_url": url,
                            "metadata": {"type": "schedule"},
                        }
                        if insert_item(conn, item):
                            total_inserted += 1
                        else:
                            total_skipped += 1
                        print(f"  [OK] {key}")

                elif task_type == "amendment":
                    text = extract_page_text(html)
                    if text:
                        item = {
                            "external_id": f"pakistani_org_{key}",
                            "law_name": "Constitution of Pakistan",
                            "section_number": part,
                            "section_text": text,
                            "related_sections": [],
                            "source_url": url,
                            "metadata": {"type": "amendment"},
                        }
                        if insert_item(conn, item):
                            total_inserted += 1
                        else:
                            total_skipped += 1
                        print(f"  [OK] {key}")

            # Small delay between batches
            if i + CONCURRENCY < len(all_tasks):
                await asyncio.sleep(DELAY)

    conn.commit()
    conn.close()

    print("\n" + "=" * 60)
    print(f"DONE: {total_inserted} items inserted, {total_skipped} skipped")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(crawl_constitution())
