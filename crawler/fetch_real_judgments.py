#!/usr/bin/env python3
"""
Fetch real judgments from accessible Pakistani legal sources.

Sources:
1. Lahore High Court (data.lhc.gov.pk) - Reported judgments
2. Sindh High Court (caselaw.shc.gov.pk) - Via Google Cache
3. Pakistan Code (pakistancode.gov.pk) - Federal laws
4. Pakistani.org - Constitution, legislative history
5. Google Scholar - Case law search
"""

import asyncio
import json
import re
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

DB_PATH = Path(__file__).parent.parent / "backend" / "plse.db"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def init_db(db_path: Path) -> sqlite3.Connection:
    """Initialize database connection."""
    conn = sqlite3.connect(str(db_path))
    return conn


def insert_judgment(conn: sqlite3.Connection, item: dict) -> bool:
    """Insert a judgment into the database."""
    try:
        conn.execute("""
            INSERT OR REPLACE INTO judgments
            (external_id, title, citation, court, bench, judge, date, case_number,
             sections_referenced, full_text, description, source_url, pdf_url, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            item["external_id"],
            item["title"],
            item.get("citation", ""),
            item.get("court", ""),
            item.get("bench", ""),
            item.get("judge", ""),
            item.get("date", ""),
            item.get("case_number", ""),
            json.dumps(item.get("sections", [])),
            item.get("full_text", ""),
            item.get("description", ""),
            item.get("source_url", ""),
            item.get("pdf_url"),
            json.dumps(item.get("metadata", {})),
        ))
        return True
    except Exception as e:
        print(f"  [ERROR] Insert failed: {e}")
        return False


def insert_law_section(conn: sqlite3.Connection, item: dict) -> bool:
    """Insert a law section into the database."""
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
            item.get("source_url", ""),
            json.dumps(item.get("metadata", {})),
        ))
        return True
    except Exception as e:
        print(f"  [ERROR] Insert failed: {e}")
        return False


async def fetch_lhc_judgments(conn: sqlite3.Connection) -> int:
    """Fetch real judgments from Lahore High Court data portal."""
    print("\n[LHC] Fetching from data.lhc.gov.pk...")
    count = 0

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, http2=True) as client:
            # Fetch reported judgments page
            resp = await client.get(
                "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
                headers={"User-Agent": USER_AGENT},
            )

            if resp.status_code != 200:
                print(f"  [WARN] HTTP {resp.status_code}")
                return 0

            soup = BeautifulSoup(resp.text, "lxml")

            # Find judgment entries in the page
            # LHC data portal has tables with judgment info
            tables = soup.find_all("table")

            for table in tables:
                rows = table.find_all("tr")
                for row in rows:
                    cells = row.find_all("td")
                    if len(cells) >= 3:
                        # Try to extract: case number, title, citation, date
                        cell_texts = [c.get_text(strip=True) for c in cells]

                        # Look for citation patterns
                        title = cell_texts[0] if len(cell_texts) > 0 else ""
                        citation = cell_texts[1] if len(cell_texts) > 1 else ""
                        date_str = cell_texts[2] if len(cell_texts) > 2 else ""

                        # Skip header rows
                        if not title or title.lower() in ("sr", "case title", "title", "s.no", "serial"):
                            continue

                        # Look for links
                        link = row.find("a")
                        source_url = ""
                        if link and link.get("href"):
                            href = link["href"]
                            if href.startswith("http"):
                                source_url = href
                            elif href.startswith("/"):
                                source_url = f"https://data.lhc.gov.pk{href}"

                        # Parse citation from title if not separate
                        if not citation and title:
                            cit_match = re.search(r'(\d{4}\s+\w+\s+\d+)', title)
                            if cit_match:
                                citation = cit_match.group(1)

                        if title and len(title) > 10:
                            # Extract year from citation or date
                            year_match = re.search(r'(\d{4})', citation or date_str or "")
                            year = year_match.group(1) if year_match else ""

                            insert_judgment(conn, {
                                "external_id": f"lhc_{hash(title + citation) % 1000000}",
                                "title": title[:200],
                                "citation": citation,
                                "court": "Lahore High Court",
                                "date": date_str or f"{year}-01-01" if year else "",
                                "source_url": source_url or "https://data.lhc.gov.pk",
                                "metadata": {"source": "lhc_data_portal"},
                            })
                            count += 1

            # Also try the green bench orders
            resp2 = await client.get(
                "https://data.lhc.gov.pk/reported_judgments/green_bench_orders",
                headers={"User-Agent": USER_AGENT},
            )

            if resp2.status_code == 200:
                soup2 = BeautifulSoup(resp2.text, "lxml")
                for table in soup2.find_all("table"):
                    for row in table.find_all("tr"):
                        cells = row.find_all("td")
                        if len(cells) >= 2:
                            title = cells[0].get_text(strip=True)
                            if title and len(title) > 10 and title.lower() not in ("sr", "case title", "title"):
                                link = row.find("a")
                                source_url = ""
                                if link and link.get("href"):
                                    href = link["href"]
                                    source_url = href if href.startswith("http") else f"https://data.lhc.gov.pk{href}"

                                insert_judgment(conn, {
                                    "external_id": f"lhc_green_{hash(title) % 1000000}",
                                    "title": title[:200],
                                    "court": "Lahore High Court",
                                    "source_url": source_url or "https://data.lhc.gov.pk",
                                    "metadata": {"source": "lhc_green_bench"},
                                })
                                count += 1

            conn.commit()
            print(f"  [OK] Fetched {count} judgments from LHC")

    except Exception as e:
        print(f"  [ERROR] LHC fetch failed: {e}")

    return count


async def fetch_ihc_judgments(conn: sqlite3.Connection) -> int:
    """Fetch real judgments from Islamabad High Court."""
    print("\n[IHC] Fetching from ihc.gov.pk...")
    count = 0

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, http2=True) as client:
            resp = await client.get(
                "https://ihc.gov.pk/Judgments",
                headers={"User-Agent": USER_AGENT},
            )

            if resp.status_code != 200:
                print(f"  [WARN] HTTP {resp.status_code}")
                return 0

            soup = BeautifulSoup(resp.text, "lxml")

            # Look for judgment entries
            # IHC typically has a list/card layout
            for elem in soup.find_all(["div", "li", "article"]):
                text = elem.get_text(strip=True)

                # Look for citation patterns
                cit_match = re.search(r'((?:PLD|SCMR|YLR|CLD|MLD|PTD|PCrLJ)\s+\d{4}\s+\w+\s+\d+)', text)
                if cit_match:
                    citation = cit_match.group(1)
                    # Extract title (text before citation)
                    title_part = text[:text.find(citation)].strip()
                    if not title_part:
                        title_part = text[:100]

                    link = elem.find("a")
                    source_url = ""
                    if link and link.get("href"):
                        href = link["href"]
                        source_url = href if href.startswith("http") else f"https://ihc.gov.pk{href}"

                    insert_judgment(conn, {
                        "external_id": f"ihc_{hash(citation) % 1000000}",
                        "title": title_part[:200],
                        "citation": citation,
                        "court": "Islamabad High Court",
                        "source_url": source_url or "https://ihc.gov.pk/Judgments",
                        "metadata": {"source": "ihc_portal"},
                    })
                    count += 1

            conn.commit()
            print(f"  [OK] Fetched {count} judgments from IHC")

    except Exception as e:
        print(f"  [ERROR] IHC fetch failed: {e}")

    return count


async def fetch_fsc_judgments(conn: sqlite3.Connection) -> int:
    """Fetch real judgments from Federal Shariat Court."""
    print("\n[FSC] Fetching from federalshariatcourt.gov.pk...")
    count = 0

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, http2=True) as client:
            resp = await client.get(
                "https://www.federalshariatcourt.gov.pk/en/",
                headers={"User-Agent": USER_AGENT},
            )

            if resp.status_code != 200:
                print(f"  [WARN] HTTP {resp.status_code}")
                return 0

            soup = BeautifulSoup(resp.text, "lxml")

            # Look for judgment entries
            for elem in soup.find_all(["div", "li", "article", "tr"]):
                text = elem.get_text(strip=True)

                # Look for citation or case patterns
                cit_match = re.search(r'((?:PLD|SCMR|YLR)\s+\d{4}\s+\w+\s+\d+)', text)
                if cit_match:
                    citation = cit_match.group(1)
                    title_part = text[:text.find(citation)].strip()
                    if not title_part:
                        title_part = text[:100]

                    link = elem.find("a")
                    source_url = ""
                    if link and link.get("href"):
                        href = link["href"]
                        source_url = href if href.startswith("http") else f"https://www.federalshariatcourt.gov.pk{href}"

                    insert_judgment(conn, {
                        "external_id": f"fsc_{hash(citation) % 1000000}",
                        "title": title_part[:200],
                        "citation": citation,
                        "court": "Federal Shariat Court",
                        "source_url": source_url or "https://www.federalshariatcourt.gov.pk",
                        "metadata": {"source": "fsc_portal"},
                    })
                    count += 1

            conn.commit()
            print(f"  [OK] Fetched {count} judgments from FSC")

    except Exception as e:
        print(f"  [ERROR] FSC fetch failed: {e}")

    return count


async def fetch_pakistan_code_laws(conn: sqlite3.Connection) -> int:
    """Fetch real law sections from Pakistan Code."""
    print("\n[Pakistan Code] Fetching from pakistancode.gov.pk...")
    count = 0

    # Key laws to fetch
    key_laws = [
        ("Pakistan Penal Code 1860", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Criminal Procedure Code 1898", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Code of Civil Procedure 1908", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Qanun-e-Shahadat Order 1984", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Prevention of Electronic Crimes Act 2016", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Anti-Terrorism Act 1997", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Muslim Family Laws Ordinance 1961", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Contract Act 1872", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Transfer of Property Act 1882", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
        ("Limitation Act 1908", "https://pakistancode.gov.pk/english/LGu0xAD.php"),
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, http2=True) as client:
            # First, fetch the main page to get the law categories
            resp = await client.get(
                "https://pakistancode.gov.pk/english/LGu0xAD.php",
                headers={"User-Agent": USER_AGENT},
            )

            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")

                # Find links to individual laws
                law_links = []
                for link in soup.find_all("a"):
                    href = link.get("href", "")
                    text = link.get_text(strip=True)
                    if href and text and ("act" in text.lower() or "code" in text.lower() or "ordinance" in text.lower()):
                        if href.startswith("http"):
                            law_links.append((text, href))
                        elif href.startswith("/"):
                            law_links.append((text, f"https://pakistancode.gov.pk{href}"))

                # Fetch a few key laws
                for law_name, law_url in law_links[:5]:
                    try:
                        law_resp = await client.get(law_url, headers={"User-Agent": USER_AGENT}, timeout=15.0)
                        if law_resp.status_code == 200:
                            law_soup = BeautifulSoup(law_resp.text, "lxml")

                            # Extract sections from the law page
                            section_count = 0
                            for elem in law_soup.find_all(["h2", "h3", "p", "div"]):
                                text = elem.get_text(strip=True)

                                # Look for section patterns
                                sec_match = re.search(r'(?:Section|Sec\.)\s+(\d+[A-Za-z]*)', text, re.IGNORECASE)
                                if sec_match:
                                    sec_num = sec_match.group(1)
                                    # Get the section text (next sibling or parent text)
                                    section_text = text

                                    insert_law_section(conn, {
                                        "external_id": f"pakistancode_{law_name}_{sec_num}",
                                        "law_name": law_name,
                                        "section_number": sec_num,
                                        "section_text": section_text[:1000],
                                        "source_url": law_url,
                                        "metadata": {"source": "pakistancode"},
                                    })
                                    section_count += 1
                                    count += 1

                            if section_count > 0:
                                print(f"  [OK] {law_name}: {section_count} sections")

                        # Small delay between requests
                        await asyncio.sleep(1.0)

                    except Exception as e:
                        print(f"  [WARN] Failed to fetch {law_name}: {e}")

            conn.commit()
            print(f"  [OK] Total: {count} law sections from Pakistan Code")

    except Exception as e:
        print(f"  [ERROR] Pakistan Code fetch failed: {e}")

    return count


async def fetch_google_scholar_judgments(conn: sqlite3.Connection) -> int:
    """Fetch judgment citations from Google Scholar."""
    print("\n[Google Scholar] Searching for Pakistani case law...")
    count = 0

    # Search queries for different courts
    queries = [
        "site:scp.gov.pk judgment 2024",
        "site:lhc.gov.pk reported judgment 2024",
        "Pakistan Supreme Court judgment 2024 SCMR",
        "Pakistan High Court judgment 2024 PLD",
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, http2=True) as client:
            for query in queries[:2]:  # Limit to avoid rate limiting
                try:
                    resp = await client.get(
                        "https://scholar.google.com/scholar",
                        params={"q": query, "as_sdt": "0,5", "hl": "en"},
                        headers={"User-Agent": USER_AGENT},
                    )

                    if resp.status_code == 200:
                        html = resp.text

                        # Parse scholar results
                        blocks = re.findall(
                            r'<div class="gs_r gs_or gs_scl">(.*?)</div>\s*(?:<div class="gs_r|$)',
                            html, re.DOTALL
                        )

                        for block in blocks:
                            title_match = re.search(r'<h3[^>]*>(.*?)</h3>', block, re.DOTALL)
                            link_match = re.search(r'href="(https?://[^"]+)"', block)

                            if title_match and link_match:
                                title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                                url = link_match.group(1)

                                # Extract citation from title
                                cit_match = re.search(r'(\d{4}\s+\w+\s+\d+)', title)
                                citation = cit_match.group(1) if cit_match else ""

                                if title and len(title) > 10:
                                    insert_judgment(conn, {
                                        "external_id": f"scholar_{hash(title) % 1000000}",
                                        "title": title[:200],
                                        "citation": citation,
                                        "court": "Supreme Court of Pakistan",
                                        "source_url": url,
                                        "metadata": {"source": "google_scholar"},
                                    })
                                    count += 1

                    # Rate limiting
                    await asyncio.sleep(5.0)

                except Exception as e:
                    print(f"  [WARN] Scholar search failed: {e}")

            conn.commit()
            print(f"  [OK] Fetched {count} citations from Google Scholar")

    except Exception as e:
        print(f"  [ERROR] Google Scholar fetch failed: {e}")

    return count


async def main():
    """Main entry point."""
    print("=" * 60)
    print("LegalSearch Pakistan - Real Data Fetcher")
    print("=" * 60)

    if not DB_PATH.exists():
        print(f"[ERROR] Database not found: {DB_PATH}")
        sys.exit(1)

    conn = init_db(DB_PATH)
    print(f"[DB] Connected to: {DB_PATH}")

    total_judgments = 0
    total_laws = 0

    # Fetch from each source
    total_judgments += await fetch_lhc_judgments(conn)
    total_judgments += await fetch_ihc_judgments(conn)
    total_judgments += await fetch_fsc_judgments(conn)
    total_laws += await fetch_pakistan_code_laws(conn)
    total_judgments += await fetch_google_scholar_judgments(conn)

    # Rebuild FTS index
    print("\n[FTS] Rebuilding search index...")
    try:
        conn.execute('INSERT INTO judgments_fts(judgments_fts) VALUES("rebuild")')
        conn.execute('INSERT INTO law_sections_fts(law_sections_fts) VALUES("rebuild")')
        conn.commit()
        print("  [OK] FTS index rebuilt")
    except Exception as e:
        print(f"  [WARN] FTS rebuild: {e}")

    conn.close()

    print("\n" + "=" * 60)
    print(f"DONE: {total_judgments} judgments + {total_laws} law sections fetched")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
