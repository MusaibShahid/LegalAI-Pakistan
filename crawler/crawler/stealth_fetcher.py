"""
Stealth web fetcher for safely accessing Pakistani court websites.

Uses multiple strategies to avoid IP blocking:
1. Browser automation with Playwright (looks like real user)
2. Rotating user agents and browser fingerprints
3. Smart random delays between requests
4. Session/cookie management
5. Optional proxy rotation
6. Google Cache fallback
7. Web Archive (Wayback Machine) fallback
8. Request fingerprint randomization
"""

import asyncio
import random
import time
import hashlib
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from urllib.parse import quote_plus, urljoin
from dataclasses import dataclass, field

import httpx

# ── User Agents ────────────────────────────────────────────────

USER_AGENTS = [
    # Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    # Chrome on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    # Firefox on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    # Firefox on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    # Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    # Safari on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

# ── Accept Languages ───────────────────────────────────────────

ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.9,ur;q=0.8",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.8,en-GB;q=0.6",
]

# ── Data Classes ───────────────────────────────────────────────

@dataclass
class FetchResult:
    url: str
    status_code: int
    html: str | None = None
    error: str | None = None
    source: str = "direct"  # direct, google_cache, wayback
    fetched_at: str = field(default_factory=lambda: datetime.now().isoformat())


# ── Cache Database ─────────────────────────────────────────────

class FetchCache:
    """SQLite-backed cache for fetched pages."""

    def __init__(self, db_path: str = "fetch_cache.db"):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                url_hash TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                html TEXT,
                status_code INTEGER,
                source TEXT,
                fetched_at TEXT,
                expires_at TEXT
            )
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at)
        """)
        self.conn.commit()

    def _hash(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()

    def get(self, url: str, max_age_hours: int = 24) -> FetchResult | None:
        """Get cached result if not expired."""
        h = self._hash(url)
        cutoff = (datetime.now() - timedelta(hours=max_age_hours)).isoformat()
        row = self.conn.execute(
            "SELECT url, html, status_code, source, fetched_at FROM cache WHERE url_hash = ? AND fetched_at > ?",
            (h, cutoff)
        ).fetchone()
        if row:
            return FetchResult(url=row[0], html=row[1], status_code=row[2], source=row[3], fetched_at=row[4])
        return None

    def put(self, result: FetchResult, ttl_hours: int = 24):
        """Store result in cache."""
        h = self._hash(result.url)
        expires = (datetime.now() + timedelta(hours=ttl_hours)).isoformat()
        self.conn.execute(
            "INSERT OR REPLACE INTO cache (url_hash, url, html, status_code, source, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (h, result.url, result.html, result.status_code, result.source, result.fetched_at, expires)
        )
        self.conn.commit()

    def clear_expired(self):
        """Remove expired entries."""
        now = datetime.now().isoformat()
        self.conn.execute("DELETE FROM cache WHERE expires_at < ?", (now,))
        self.conn.commit()


# ── Stealth Fetcher ────────────────────────────────────────────

class StealthFetcher:
    """
    Safely fetch web pages using multiple strategies:
    1. Direct HTTP with stealth headers
    2. Google Cache fallback
    3. Wayback Machine fallback
    4. Optional Playwright browser automation
    """

    def __init__(
        self,
        proxy: str | None = None,
        cache_db: str = "fetch_cache.db",
        min_delay: float = 2.0,
        max_delay: float = 8.0,
    ):
        self.proxy = proxy
        self.cache = FetchCache(cache_db)
        self.min_delay = min_delay
        self.max_delay = max_delay
        self._last_request_time = 0.0
        self._request_count = 0
        self._blocked_domains: set[str] = set()

    def _random_headers(self, referer: str | None = None) -> dict:
        """Generate randomized browser-like headers."""
        ua = random.choice(USER_AGENTS)
        lang = random.choice(ACCEPT_LANGUAGES)

        headers = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": lang,
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none" if not referer else "same-origin",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
            "DNT": "1",
        }

        if referer:
            headers["Referer"] = referer

        # Randomly add some optional headers
        if random.random() > 0.5:
            headers["Sec-CH-UA"] = f'"Chromium";v="{random.randint(120, 126)}", "Google Chrome";v="{random.randint(120, 126)}"'
            headers["Sec-CH-UA-Mobile"] = "?0"
            headers["Sec-CH-UA-Platform"] = random.choice(['"Windows"', '"macOS"'])

        return headers

    async def _smart_delay(self):
        """Wait a random amount of time between requests."""
        now = time.time()
        elapsed = now - self._last_request_time
        delay = random.uniform(self.min_delay, self.max_delay)

        # Add extra delay if making many requests
        if self._request_count > 10:
            delay += random.uniform(1.0, 3.0)
        if self._request_count > 30:
            delay += random.uniform(2.0, 5.0)

        remaining = delay - elapsed
        if remaining > 0:
            await asyncio.sleep(remaining)

        self._last_request_time = time.time()
        self._request_count += 1

    async def fetch_direct(self, url: str) -> FetchResult:
        """Fetch URL directly with stealth headers."""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc

        if domain in self._blocked_domains:
            return FetchResult(url=url, status_code=0, error=f"Domain {domain} is blocked (previous failure)")

        await self._smart_delay()

        headers = self._random_headers()
        client_kwargs = {
            "headers": headers,
            "follow_redirects": True,
            "timeout": 30.0,
            "http2": True,
        }
        if self.proxy:
            client_kwargs["proxy"] = self.proxy

        try:
            async with httpx.AsyncClient(**client_kwargs) as client:
                resp = await client.get(url)

                # Check for blocking patterns
                if resp.status_code == 403:
                    text = resp.text.lower()
                    if "blocked" in text or "forbidden" in text or "access denied" in text:
                        self._blocked_domains.add(domain)
                        return FetchResult(
                            url=url, status_code=403,
                            error=f"Blocked by {domain} WAF",
                            source="direct"
                        )

                if resp.status_code == 429:
                    # Rate limited - back off
                    await asyncio.sleep(random.uniform(30, 60))
                    return FetchResult(
                        url=url, status_code=429,
                        error="Rate limited",
                        source="direct"
                    )

                if resp.status_code == 200:
                    return FetchResult(
                        url=url, status_code=200,
                        html=resp.text,
                        source="direct"
                    )

                return FetchResult(
                    url=url, status_code=resp.status_code,
                    error=f"HTTP {resp.status_code}",
                    source="direct"
                )

        except Exception as e:
            return FetchResult(url=url, status_code=0, error=str(e), source="direct")

    async def fetch_google_cache(self, url: str) -> FetchResult:
        """Try to fetch from Google Cache."""
        cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{quote_plus(url)}"

        headers = self._random_headers("https://www.google.com/")
        try:
            async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30.0) as client:
                resp = await client.get(cache_url)
                if resp.status_code == 200 and "webcache" in resp.text.lower():
                    return FetchResult(
                        url=url, status_code=200,
                        html=resp.text,
                        source="google_cache"
                    )
        except Exception:
            pass

        return FetchResult(url=url, status_code=0, error="Not in Google Cache", source="google_cache")

    async def fetch_wayback(self, url: str) -> FetchResult:
        """Try to fetch from Wayback Machine (archive.org)."""
        # First check if archived version exists
        availability_url = f"https://archive.org/wayback/available?url={quote_plus(url)}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(availability_url)
                if resp.status_code == 200:
                    data = resp.json()
                    snapshot = data.get("archived_snapshots", {}).get("closest", {})
                    if snapshot.get("available"):
                        archive_url = snapshot["url"]
                        # Fetch the archived page
                        page_resp = await client.get(archive_url, follow_redirects=True, timeout=30.0)
                        if page_resp.status_code == 200:
                            return FetchResult(
                                url=url, status_code=200,
                                html=page_resp.text,
                                source="wayback"
                            )
        except Exception:
            pass

        return FetchResult(url=url, status_code=0, error="Not in Wayback Machine", source="wayback")

    async def fetch(self, url: str, use_cache: bool = True, fallbacks: bool = True) -> FetchResult:
        """
        Fetch a URL with full stealth strategy:
        1. Check cache first
        2. Try direct fetch with stealth headers
        3. If blocked, try Google Cache
        4. If still blocked, try Wayback Machine
        5. Cache the result
        """
        # Check cache
        if use_cache:
            cached = self.cache.get(url)
            if cached:
                return cached

        # Try direct
        result = await self.fetch_direct(url)
        if result.status_code == 200 and result.html:
            if use_cache:
                self.cache.put(result)
            return result

        if not fallbacks:
            return result

        # Try Google Cache
        result = await self.fetch_google_cache(url)
        if result.status_code == 200 and result.html:
            if use_cache:
                self.cache.put(result, ttl_hours=48)  # Cache fallbacks longer
            return result

        # Try Wayback Machine
        result = await self.fetch_wayback(url)
        if result.status_code == 200 and result.html:
            if use_cache:
                self.cache.put(result, ttl_hours=72)
            return result

        return result

    def get_stats(self) -> dict:
        """Get fetcher statistics."""
        return {
            "request_count": self._request_count,
            "blocked_domains": list(self._blocked_domains),
            "last_request": self._last_request_time,
        }


# ── Playwright Stealth Browser ─────────────────────────────────

class StealthBrowser:
    """
    Browser automation with Playwright for sites that block HTTP requests.
    Uses stealth techniques to appear as a real browser.
    """

    def __init__(self, headless: bool = True):
        self.headless = headless
        self._browser = None
        self._context = None

    async def start(self):
        """Start the browser."""
        try:
            from playwright.async_api import async_playwright
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--disable-web-security",
                    "--no-sandbox",
                ]
            )
            self._context = await self._browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent=random.choice(USER_AGENTS),
                locale="en-US",
                timezone_id="Asia/Karachi",
            )
            # Stealth: override navigator.webdriver
            await self._context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                window.chrome = { runtime: {} };
            """)
        except ImportError:
            raise ImportError("Playwright not installed. Run: pip install playwright && playwright install chromium")

    async def fetch(self, url: str, wait_for: str = "networkidle") -> FetchResult:
        """Fetch a page using the stealth browser."""
        if not self._context:
            await self.start()

        page = await self._context.new_page()
        try:
            # Random delay before navigation
            await asyncio.sleep(random.uniform(1, 3))

            response = await page.goto(url, wait_until=wait_for, timeout=60000)

            # Wait for content to load
            await asyncio.sleep(random.uniform(1, 2))

            html = await page.content()
            status = response.status if response else 0

            return FetchResult(
                url=url,
                status_code=status,
                html=html,
                source="playwright"
            )
        except Exception as e:
            return FetchResult(url=url, status_code=0, error=str(e), source="playwright")
        finally:
            await page.close()

    async def close(self):
        """Close the browser."""
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()


# ── Google Scholar Access ───────────────────────────────────────

class GoogleScholarScraper:
    """
    Safely scrape Google Scholar for Pakistani case law.
    Uses very conservative rate limiting.
    """

    BASE = "https://scholar.google.com/scholar"

    def __init__(self, fetcher: StealthFetcher):
        self.fetcher = fetcher

    async def search(self, query: str, court: str = "scp.gov.pk", year_from: int = 2020) -> list[dict]:
        """Search Google Scholar for cases."""
        q = f'site:{court} "{query}"'
        params = {
            "q": q,
            "hl": "en",
            "as_sdt": "0,5",
            "as_ylo": str(year_from),
        }
        url = f"{self.BASE}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

        result = await self.fetcher.fetch(url, fallbacks=False)
        if result.status_code != 200 or not result.html:
            return []

        # Parse results (basic extraction)
        results = []
        # Google Scholar results are in div.gs_r.gs_or.gs_scl
        # We'll extract title, snippet, and link
        import re

        # Find result blocks
        blocks = re.findall(r'<div class="gs_r gs_or gs_scl">(.*?)</div>\s*<div class="gs_r', result.html, re.DOTALL)

        for block in blocks:
            title_match = re.search(r'<h3[^>]*>(.*?)</h3>', block, re.DOTALL)
            link_match = re.search(r'href="(https?://[^"]+)"', block)
            snippet_match = re.search(r'<div class="gs_rs">(.*?)</div>', block, re.DOTALL)

            if title_match and link_match:
                title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                results.append({
                    "title": title,
                    "url": link_match.group(1),
                    "snippet": re.sub(r'<[^>]+>', '', snippet_match.group(1)).strip() if snippet_match else "",
                })

        return results


# ── Facebook Page Monitor ───────────────────────────────────────

class FacebookMonitor:
    """
    Monitor Facebook pages for court announcements and judgments.
    Uses the mobile version which is less restrictive.
    """

    COURT_PAGES = {
        "scp": "SupremeCourtOfPakistan",
        "lhc": "LahoreHighCourt",
        "shc": "SindhHighCourtOfficial",
        "ihc": "IslamabadHighCourt",
        "phc": "PeshawarHighCourt",
        "bhc": "BalochistanHighCourt",
    }

    def __init__(self, fetcher: StealthFetcher):
        self.fetcher = fetcher

    async def get_recent_posts(self, court_key: str, limit: int = 10) -> list[dict]:
        """Get recent posts from a court's Facebook page."""
        page_name = self.COURT_PAGES.get(court_key)
        if not page_name:
            return []

        # Use mobile Facebook which is less restrictive
        url = f"https://m.facebook.com/{page_name}"

        result = await self.fetcher.fetch(url, fallbacks=False)
        if result.status_code != 200 or not result.html:
            return []

        # Basic extraction of posts
        import re
        posts = []

        # Find story/message blocks
        story_blocks = re.findall(r'<div[^>]*data-ft="[^"]*"[^>]*>(.*?)</div>', result.html, re.DOTALL)

        for block in story_blocks[:limit]:
            text = re.sub(r'<[^>]+>', ' ', block).strip()
            if len(text) > 50:  # Filter out short fragments
                posts.append({
                    "text": text[:500],
                    "source": f"facebook/{page_name}",
                })

        return posts


# ── Convenience Function ────────────────────────────────────────

async def safe_fetch(url: str, **kwargs) -> FetchResult:
    """Convenience function for safe fetching."""
    fetcher = StealthFetcher(**{k: v for k, v in kwargs.items() if k in ["proxy", "cache_db", "min_delay", "max_delay"]})
    return await fetcher.fetch(url, use_cache=kwargs.get("use_cache", True), fallbacks=kwargs.get("fallbacks", True))
