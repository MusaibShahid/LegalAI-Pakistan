import re
from datetime import datetime
from itemadapter import ItemAdapter

from crawler.items import LegalDocumentItem, LawSectionItem


class MetadataPipeline:
    """Clean and normalize extracted metadata."""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        if isinstance(item, LegalDocumentItem):
            self._process_legal_document(adapter)
        elif isinstance(item, LawSectionItem):
            self._process_law_section(adapter)

        return item

    def _process_legal_document(self, adapter):
        # Normalize title
        if adapter.get("title"):
            adapter["title"] = adapter["title"].strip()

        # Normalize citation
        if adapter.get("citation"):
            adapter["citation"] = adapter["citation"].strip().upper()

        # Parse and normalize date
        if adapter.get("date"):
            try:
                date_str = adapter["date"].strip()
                for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y", "%B %d, %Y"]:
                    try:
                        parsed = datetime.strptime(date_str, fmt)
                        adapter["date"] = parsed.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
            except Exception:
                pass

        # Extract sections if not already present
        if adapter.get("full_text") and not adapter.get("sections_referenced"):
            sections = re.findall(
                r"(\d+[A-Z]?(?:-[A-Z])?)\s+(PPC|CrPC|PECA)", 
                adapter["full_text"],
                re.IGNORECASE,
            )
            adapter["sections_referenced"] = [f"{s[0]} {s[1].upper()}" for s in sections]

        # Ensure lists
        if not adapter.get("sections_referenced"):
            adapter["sections_referenced"] = []

        # Generate description from full text
        if adapter.get("full_text") and not adapter.get("description"):
            text = adapter["full_text"]
            adapter["description"] = text[:300].strip() + ("..." if len(text) > 300 else "")

    def _process_law_section(self, adapter):
        if adapter.get("section_text"):
            adapter["section_text"] = adapter["section_text"].strip()
        if adapter.get("law_name"):
            adapter["law_name"] = adapter["law_name"].strip().upper()
        if not adapter.get("related_sections"):
            adapter["related_sections"] = []
        if not adapter.get("related_judgments"):
            adapter["related_judgments"] = []
