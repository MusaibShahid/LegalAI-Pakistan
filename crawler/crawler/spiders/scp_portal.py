import scrapy
import re
from urllib.parse import urljoin
from crawler.items import LegalDocumentItem


class SCPPortalSpider(scrapy.Spider):
    """Spider for Supreme Court of Pakistan Portal (scp.gov.pk).

    Scrapes the Latest Judgments page which contains:
    - Case Subject
    - Case Number
    - Case Title
    - Author Judge
    - Judgment Date
    - Upload Date
    - Citation
    - SC Citation
    - PDF Download Link
    """

    name = "scp_portal"
    source_name = "supreme_court"
    allowed_domains = ["scp.gov.pk", "supremecourt.gov.pk"]
    start_urls = [
        "https://scp.gov.pk/LatestJudgments",
    ]

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://scp.gov.pk/",
    }

    def parse(self, response):
        """Parse the Latest Judgments table from SCP portal."""
        # Find the table rows - the page has a table with judgment data
        rows = response.css("table tr")

        for row in rows:
            cells = row.css("td")
            if len(cells) >= 9:
                # Extract data from each cell
                sr_no = cells[0].css("::text").get("").strip()
                case_subject = cells[1].css("::text").get("").strip()
                case_no = cells[2].css("::text").get("").strip()
                case_title = cells[3].css("::text").get("").strip()
                author_judge = cells[4].css("::text").get("").strip()
                judgment_date = cells[5].css("::text").get("").strip()
                upload_date = cells[6].css("::text").get("").strip()
                citation = cells[7].css("::text").get("").strip()
                sc_citation = cells[8].css("::text").get("").strip()

                # Get PDF link
                pdf_link = cells[9].css("a::attr(href)").get("") if len(cells) > 9 else ""
                if pdf_link:
                    pdf_link = urljoin(response.url, pdf_link)

                # Skip header rows
                if sr_no and sr_no.isdigit():
                    item = LegalDocumentItem(
                        source=self.source_name,
                        external_id=f"scp_{case_no.replace('/', '_').replace(' ', '_')}",
                        url=response.url,
                        title=case_title,
                        citation=sc_citation or citation,
                        court="Supreme Court of Pakistan",
                        bench="",
                        judge=author_judge,
                        date=self._parse_date(judgment_date),
                        case_number=case_no,
                        sections_referenced=[],
                        description=case_subject,
                        full_text="",
                        pdf_url=pdf_link,
                        raw_html=response.text,
                        metadata_json={
                            "sr_no": sr_no,
                            "case_subject": case_subject,
                            "upload_date": upload_date,
                            "judgment_date_raw": judgment_date,
                            "citation_raw": citation,
                            "sc_citation_raw": sc_citation,
                        },
                    )
                    yield item

        # Follow pagination if available
        next_page = response.css("a.next::attr(href), .pagination a.next::attr(href)").get()
        if next_page:
            yield scrapy.Request(
                url=urljoin(response.url, next_page),
                callback=self.parse,
            )

    def _parse_date(self, date_str: str) -> str:
        """Parse date from DD-MM-YYYY or similar formats."""
        if not date_str:
            return ""
        # Try to parse DD-MM-YYYY
        match = re.match(r"(\d{2})-(\d{2})-(\d{4})", date_str)
        if match:
            day, month, year = match.groups()
            return f"{year}-{month}-{day}"
        return date_str


class SCPJudgmentDetailSpider(scrapy.Spider):
    """Spider for fetching individual judgment details from SCP portal.

    This can be used to fetch full text from individual judgment pages.
    """

    name = "scp_judgment_detail"
    source_name = "supreme_court"
    allowed_domains = ["scp.gov.pk", "supremecourt.gov.pk"]

    custom_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://scp.gov.pk/LatestJudgments",
    }

    def __init__(self, judgment_urls=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_urls = judgment_urls or []

    def parse(self, response):
        """Parse individual judgment page."""
        title = response.css("h1::text, .judgment-title::text, .case-title::text").get("").strip()
        full_text = response.css(".judgment-text, .entry-content, article, main").get("")

        # Extract citation from page
        citation = response.css(".citation::text, .case-citation::text").get("").strip()

        # Extract judge
        judge = response.css(".judge::text, .author::text").get("").strip()

        # Extract date
        date = response.css(".date::text, .judgment-date::text, time::text").get("").strip()

        # Get PDF link
        pdf_url = response.css("a[href$='.pdf']::attr(href)").get("")
        if pdf_url:
            pdf_url = urljoin(response.url, pdf_url)

        yield LegalDocumentItem(
            source=self.source_name,
            external_id=response.url.split("/")[-1].split(".")[0],
            url=response.url,
            title=title,
            citation=citation,
            court="Supreme Court of Pakistan",
            bench="",
            judge=judge,
            date=date,
            case_number="",
            sections_referenced=[],
            description="",
            full_text=full_text,
            pdf_url=pdf_url,
            raw_html=response.text,
        )
