#!/usr/bin/env python3
"""
Test accessibility of all Pakistani legal data sources.
Run this to see which sources are reachable from your network.
"""

import asyncio
import httpx
import time
import sys
from datetime import datetime


SOURCES = [
    # Courts
    ("Supreme Court (scp.gov.pk)", "https://scp.gov.pk"),
    ("Supreme Court (supremecourt.gov.pk)", "https://www.supremecourt.gov.pk"),
    ("Lahore High Court", "https://lhc.gov.pk"),
    ("LHC Data Portal", "https://data.lhc.gov.pk"),
    ("Sindh High Court", "https://caselaw.shc.gov.pk"),
    ("Islamabad High Court", "https://ihc.gov.pk"),
    ("Peshawar High Court", "https://phc.gov.pk"),
    ("Balochistan High Court", "https://bhc.gov.pk"),
    ("Federal Shariat Court", "https://www.federalshariatcourt.gov.pk"),

    # Law Databases
    ("Pakistan Code", "https://pakistancode.gov.pk"),
    ("DRS (Ministry of Law)", "https://drs.molaw.gov.pk"),
    ("Pakistani.org", "https://www.pakistani.org"),

    # Archives
    ("Wayback Machine API", "https://archive.org/wayback/available?url=scp.gov.pk"),
    ("Google Cache Test", "https://webcache.googleusercontent.com/search?q=cache:scp.gov.pk"),

    # Social Media (mobile versions)
    ("Facebook (m.facebook.com)", "https://m.facebook.com/SupremeCourtOfPakistan"),

    # Aggregators
    ("WorldLII Pakistan", "https://www.worldlii.org/cgi-bin/disp.pl/db/pk"),
    ("Google Scholar", "https://scholar.google.com/scholar?q=site:scp.gov.pk&as_sdt=0,5"),
]


async def test_source(name: str, url: str) -> dict:
    """Test if a source is accessible."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    start = time.time()
    try:
        async with httpx.AsyncClient(
            headers=headers,
            follow_redirects=True,
            timeout=15.0,
            http2=True,
        ) as client:
            resp = await client.get(url)
            elapsed = time.time() - start

            # Determine status
            if resp.status_code == 200:
                content = resp.text.lower()
                if "blocked" in content[:500] or "access denied" in content[:500]:
                    status = "BLOCKED"
                    icon = "X"
                elif "captcha" in content[:1000] or "robot" in content[:1000]:
                    status = "CAPTCHA"
                    icon = "!"
                elif "cloudflare" in content[:500] and "just a moment" in content[:500]:
                    status = "CLOUDFLARE"
                    icon = "!"
                else:
                    status = "OK"
                    icon = "OK"
            elif resp.status_code in (301, 302):
                status = f"REDIRECT({resp.status_code})"
                icon = ">"
            elif resp.status_code == 403:
                status = "FORBIDDEN"
                icon = "X"
            elif resp.status_code == 404:
                status = "NOT_FOUND"
                icon = "?"
            elif resp.status_code == 503:
                status = "UNAVAILABLE"
                icon = "X"
            else:
                status = f"HTTP_{resp.status_code}"
                icon = "?"

            return {
                "name": name,
                "url": url,
                "status": status,
                "icon": icon,
                "status_code": resp.status_code,
                "time": f"{elapsed:.1f}s",
                "size": f"{len(resp.text)//1024}KB",
            }

    except httpx.ConnectError:
        return {"name": name, "url": url, "status": "CONNECT_FAIL", "icon": "X", "status_code": 0, "time": "-", "size": "-"}
    except httpx.TimeoutException:
        return {"name": name, "url": url, "status": "TIMEOUT", "icon": "T", "status_code": 0, "time": "-", "size": "-"}
    except Exception as e:
        return {"name": name, "url": url, "status": f"ERROR: {str(e)[:30]}", "icon": "X", "status_code": 0, "time": "-", "size": "-"}


async def main():
    print("=" * 80)
    print(f"PAKISTANI LEGAL DATA SOURCES - ACCESSIBILITY TEST")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    results = []
    for name, url in SOURCES:
        sys.stdout.write(f"\n  Testing {name}... ")
        sys.stdout.flush()
        result = await test_source(name, url)
        results.append(result)
        print(f"{result['icon']} {result['status']} ({result['time']})")
        # Small delay between tests
        await asyncio.sleep(1)

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    ok = [r for r in results if r["status"] == "OK"]
    blocked = [r for r in results if r["status"] in ("BLOCKED", "FORBIDDEN", "UNAVAILABLE")]
    other = [r for r in results if r["status"] not in ("OK", "BLOCKED", "FORBIDDEN", "UNAVAILABLE")]

    print(f"\n  OK Accessible:  {len(ok)}")
    for r in ok:
        print(f"    • {r['name']} ({r['time']})")

    print(f"\n  X Blocked:     {len(blocked)}")
    for r in blocked:
        print(f"    • {r['name']} ({r['status']})")

    if other:
        print(f"\n  ? Other:       {len(other)}")
        for r in other:
            print(f"    • {r['name']} ({r['status']})")

    # Recommendations
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)

    if ok:
        print("\n  Use these sources directly:")
        for r in ok:
            print(f"    > {r['name']}")

    if blocked:
        print("\n  For blocked sources, use:")
        print("    > Wayback Machine (archive.org)")
        print("    > Google Cache")
        print("    > Playwright with stealth mode")
        print("    > Residential proxy rotation")

    print()


if __name__ == "__main__":
    asyncio.run(main())
