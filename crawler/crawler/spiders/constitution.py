import re
import scrapy
from crawler.items import LawSectionItem
from crawler.spiders.base import BaseLegalSpider


class ConstitutionSpider(BaseLegalSpider):
    """Spider for the Constitution of Pakistan from pakistani.org.

    Crawls ALL content:
    - Preamble
    - Parts I-XII (with all chapters)
    - Articles 1-280 (including sub-articles like 2A, 175B, etc.)
    - Schedules 1-5
    - Annex (Objectives Resolution)

    Uses a two-phase approach:
    1. Generate ALL known URLs from the dropdown menu (no missing pages)
    2. Parse each page to extract individual articles
    """

    name = "constitution"
    source_name = "pakistan_constitution"
    allowed_domains = ["pakistani.org", "www.pakistani.org"]
    BASE = "https://www.pakistani.org/pakistan/constitution"

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    # ── All known constitution pages ──────────────────────────────

    PART_PAGES = [
        "preamble",
        "part1",
        "part2.ch1", "part2.ch2",
        "part3.ch1", "part3.ch2", "part3.ch3",
        "part4.ch1", "part4.ch2", "part4.ch3",
        "part5.ch1", "part5.ch2", "part5.ch3",
        "part6.ch1", "part6.ch2", "part6.ch3",
        "part7.ch1", "part7.ch1A", "part7.ch2", "part7.ch3", "part7.ch3A", "part7.ch4",
        "part8.ch1", "part8.ch2",
        "part9",
        "part10",
        "part11",
        "part12.ch1", "part12.ch2", "part12.ch3", "part12.ch4",
        "part12.ch5", "part12.ch6", "part12.ch7",
        "annex_objres",
    ]

    SCHEDULE_PAGES = [
        "schedule1", "schedule2", "schedule3", "schedule4", "schedule5",
    ]

    AMENDMENT_PAGES = [
        "1amendment", "2amendment", "3amendment", "4amendment", "5amendment",
        "6amendment", "7amendment", "8amendment", "9amendment", "10amendment",
        "11amendment", "12amendment", "13amendment", "14amendment", "15amendment",
        "16amendment", "17amendment", "18amendment", "19amendment", "20amendment",
        "21amendment",
    ]

    # Part/Chapter metadata for context
    PART_META = {
        "preamble": {"part": "Preamble", "chapter": None, "articles": []},
        "part1": {"part": "Part I", "chapter": "Introductory", "articles": [1, 6]},
        "part2.ch1": {"part": "Part II", "chapter": "Chapter 1: Fundamental Rights", "articles": [8, 28]},
        "part2.ch2": {"part": "Part II", "chapter": "Chapter 2: Principles of Policy", "articles": [29, 40]},
        "part3.ch1": {"part": "Part III", "chapter": "Chapter 1: The President", "articles": [41, 49]},
        "part3.ch2": {"part": "Part III", "chapter": "Chapter 2: Majlis-e-Shoora (Parliament)", "articles": [50, 89]},
        "part3.ch3": {"part": "Part III", "chapter": "Chapter 3: The Federal Government", "articles": [90, 100]},
        "part4.ch1": {"part": "Part IV", "chapter": "Chapter 1: The Governors", "articles": [101, 105]},
        "part4.ch2": {"part": "Part IV", "chapter": "Chapter 2: Provincial Assemblies", "articles": [106, 128]},
        "part4.ch3": {"part": "Part IV", "chapter": "Chapter 3: The Provincial Governments", "articles": [129, 140]},
        "part5.ch1": {"part": "Part V", "chapter": "Chapter 1: Distribution of Legislative Powers", "articles": [141, 144]},
        "part5.ch2": {"part": "Part V", "chapter": "Chapter 2: Administrative Relations", "articles": [145, 152]},
        "part5.ch3": {"part": "Part V", "chapter": "Chapter 3: Special Provisions", "articles": [153, 159]},
        "part6.ch1": {"part": "Part VI", "chapter": "Chapter 1: Finance", "articles": [160, 165]},
        "part6.ch2": {"part": "Part VI", "chapter": "Chapter 2: Borrowing and Audit", "articles": [166, 171]},
        "part6.ch3": {"part": "Part VI", "chapter": "Chapter 3: Property, Contracts, Liabilities and Suits", "articles": [172, 174]},
        "part7.ch1": {"part": "Part VII", "chapter": "Chapter 1: The Courts", "articles": [175, 175]},
        "part7.ch1A": {"part": "Part VII", "chapter": "Chapter 1A: The Federal Constitutional Court", "articles": [175, 175]},
        "part7.ch2": {"part": "Part VII", "chapter": "Chapter 2: The Supreme Court", "articles": [176, 191]},
        "part7.ch3": {"part": "Part VII", "chapter": "Chapter 3: The High Courts", "articles": [192, 203]},
        "part7.ch3A": {"part": "Part VII", "chapter": "Chapter 3A: Federal Shariat Court", "articles": [203, 203]},
        "part7.ch4": {"part": "Part VII", "chapter": "Chapter 4: General Provisions Relating to Judicature", "articles": [204, 212]},
        "part8.ch1": {"part": "Part VIII", "chapter": "Chapter 1: Chief Election Commissioner", "articles": [213, 221]},
        "part8.ch2": {"part": "Part VIII", "chapter": "Chapter 2: Electoral Laws", "articles": [222, 226]},
        "part9": {"part": "Part IX", "chapter": "Islamic Provisions", "articles": [227, 231]},
        "part10": {"part": "Part X", "chapter": "Emergency Provisions", "articles": [232, 237]},
        "part11": {"part": "Part XI", "chapter": "Amendment of Constitution", "articles": [238, 239]},
        "part12.ch1": {"part": "Part XII", "chapter": "Chapter 1: Services", "articles": [240, 242]},
        "part12.ch2": {"part": "Part XII", "chapter": "Chapter 2: Armed Forces", "articles": [243, 245]},
        "part12.ch3": {"part": "Part XII", "chapter": "Chapter 3: Tribal Areas", "articles": [246, 247]},
        "part12.ch4": {"part": "Part XII", "chapter": "Chapter 4: General", "articles": [248, 259]},
        "part12.ch5": {"part": "Part XII", "chapter": "Chapter 5: Interpretation", "articles": [260, 264]},
        "part12.ch6": {"part": "Part XII", "chapter": "Chapter 6: Title, Commencement and Repeal", "articles": [265, 266]},
        "part12.ch7": {"part": "Part XII", "chapter": "Chapter 7: Transitional", "articles": [267, 280]},
        "annex_objres": {"part": "Annex", "chapter": "Objectives Resolution", "articles": []},
    }

    def start_requests(self):
        """Generate requests for ALL constitution pages."""
        requests = []

        # Part/Chapter pages
        for page in self.PART_PAGES:
            url = f"{self.BASE}/{page}.html"
            requests.append(scrapy.Request(
                url=url,
                callback=self.parse_constitution_page,
                meta={"page_key": page},
                dont_filter=True,
            ))

        # Schedule pages
        for page in self.SCHEDULE_PAGES:
            url = f"{self.BASE}/schedules/{page}.html"
            requests.append(scrapy.Request(
                url=url,
                callback=self.parse_schedule_page,
                meta={"page_key": page},
                dont_filter=True,
            ))

        # Amendment pages (for completeness)
        for page in self.AMENDMENT_PAGES:
            url = f"{self.BASE}/amendments/{page}.html"
            requests.append(scrapy.Request(
                url=url,
                callback=self.parse_amendment_page,
                meta={"page_key": page},
                dont_filter=True,
            ))

        return requests

    def parse_constitution_page(self, response):
        """Parse a constitution part/chapter page to extract individual articles.

        HTML structure:
        - <h2> contains Part/Chapter title
        - Articles are in <table> rows:
          <tr>
            <td><nobr><b>ARTICLE_NUMBER</b></nobr></td>
            <td><b>ARTICLE_TITLE</b><br>ARTICLE_TEXT...</td>
          </tr>
        - Sub-sections use nested <table> elements
        """
        page_key = response.meta["page_key"]
        meta = self.PART_META.get(page_key, {})
        part = meta.get("part", "Unknown")
        chapter = meta.get("chapter", "")

        # Extract page title from <h2>
        page_title = response.css("h2::text").get("").strip()
        if not page_title:
            page_title = f"{part}" + (f" - {chapter}" if chapter else "")

        # Find all top-level article rows
        # Articles are in the FIRST column's <b> tag (article number)
        # and the SECOND column's <b> tag (article title) + remaining text
        tables = response.css("table")

        # The main content tables (not the dropdown form table)
        # We look for tables that contain article rows with <b> tags in first column
        articles_found = []

        for table in tables:
            rows = table.css("tr")
            for row in rows:
                cells = row.css("td")
                if len(cells) < 2:
                    continue

                first_cell = cells[0]
                second_cell = cells[1]

                # Check if first cell has a bold article number
                article_num_el = first_cell.css("nobr b::text, b::text").get("")
                if not article_num_el:
                    article_num_el = first_cell.css("::text").get("").strip()

                # Clean article number
                article_num = article_num_el.strip()
                if not article_num:
                    continue

                # Must look like an article number (digits, possibly with letter suffix)
                if not re.match(r'^\d+[A-Za-z]*$', article_num):
                    continue

                # Extract article title from second cell's <b> tag
                article_title = second_cell.css("b::text").get("").strip()

                # Extract full text from second cell (everything after title)
                # Remove the title <b> element and get remaining text
                full_text_parts = []
                for elem in second_cell.css("*"):
                    tag = elem.root.tag if hasattr(elem, 'root') else ""
                    text = elem.css("::text").get("").strip()
                    if text and text != article_title:
                        full_text_parts.append(text)

                # If we couldn't get structured text, fall back to all text
                if not full_text_parts:
                    all_text = " ".join(t.strip() for t in second_cell.css("::text").getall() if t.strip())
                    # Remove the title from the beginning
                    if article_title and all_text.startswith(article_title):
                        all_text = all_text[len(article_title):].strip()
                    full_text_parts = [all_text]

                article_text = " ".join(full_text_parts).strip()
                # Clean up whitespace
                article_text = re.sub(r'\s+', ' ', article_text).strip()

                if article_num and (article_title or article_text):
                    articles_found.append({
                        "number": article_num,
                        "title": article_title,
                        "text": article_text,
                    })

        # Yield each article as a LawSectionItem
        for art in articles_found:
            article_id = f"article_{art['number']}"
            section_text = art["text"]
            if art["title"]:
                section_text = f"{art['title']}\n\n{art['text']}"

            yield LawSectionItem(
                source=self.source_name,
                external_id=f"pakistani_org_{article_id}",
                url=response.url,
                law_name="Constitution of Pakistan",
                section_number=f"Article {art['number']}",
                section_text=section_text,
                related_sections=[],
                source_url=response.url,
                raw_html=response.text[:5000],  # Limit raw HTML size
            )

        # If no articles found (e.g., preamble), yield the whole page content
        if not articles_found:
            content = self._extract_page_text(response)
            if content:
                yield LawSectionItem(
                    source=self.source_name,
                    external_id=f"pakistani_org_{page_key}",
                    url=response.url,
                    law_name="Constitution of Pakistan",
                    section_number=page_title or page_key.replace("_", " ").title(),
                    section_text=content,
                    related_sections=[],
                    source_url=response.url,
                    raw_html=response.text[:5000],
                )

    def parse_schedule_page(self, response):
        """Parse a schedule page."""
        page_key = response.meta["page_key"]
        title = response.css("h2::text, title::text").get("").strip()
        content = self._extract_page_text(response)

        if content:
            yield LawSectionItem(
                source=self.source_name,
                external_id=f"pakistani_org_{page_key}",
                url=response.url,
                law_name="Constitution of Pakistan",
                section_number=title or page_key.replace("_", " ").title(),
                section_text=content,
                related_sections=[],
                source_url=response.url,
                raw_html=response.text[:5000],
            )

    def parse_amendment_page(self, response):
        """Parse a constitutional amendment page."""
        page_key = response.meta["page_key"]
        title = response.css("h2::text, title::text").get("").strip()
        content = self._extract_page_text(response)

        if content:
            # Extract amendment number from page_key (e.g., "17amendment" -> "17")
            num_match = re.match(r'(\d+)', page_key)
            amendment_num = num_match.group(1) if num_match else page_key

            # Ordinal suffix
            n = int(amendment_num)
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

            yield LawSectionItem(
                source=self.source_name,
                external_id=f"pakistani_org_amendment_{amendment_num}",
                url=response.url,
                law_name="Constitution of Pakistan",
                section_number=f"{n}{suffix} Amendment",
                section_text=content,
                related_sections=[],
                source_url=response.url,
                raw_html=response.text[:5000],
            )

    def _extract_page_text(self, response):
        """Extract clean text from a page, removing navigation and forms."""
        # Get all text from the body, excluding the form/nav
        content_parts = []

        # Try to get content after the <hr /> that follows the navigation form
        hr_elements = response.css("hr")
        if hr_elements:
            # Get everything after the first <hr />
            body = response.css("body")
            if body:
                # Get all h2, table, p elements that are actual content
                for elem in body.css("h2, table, p, div"):
                    text = " ".join(t.strip() for t in elem.css("::text").getall() if t.strip())
                    if text and "Go to:" not in text and "Select a Part" not in text:
                        content_parts.append(text)

        if not content_parts:
            # Fallback: get all body text
            all_text = response.css("body ::text").getall()
            content_parts = [t.strip() for t in all_text if t.strip()
                           and "Go to:" not in t
                           and "Select a Part" not in t
                           and "onload" not in t]

        content = "\n\n".join(content_parts)
        # Clean up
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        return content.strip()
