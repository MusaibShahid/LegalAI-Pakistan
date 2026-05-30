import scrapy


class LegalDocumentItem(scrapy.Item):
    """Base item for legal documents from any source."""

    # Identification
    source = scrapy.Field()  # e.g., "supreme_court", "lahore_high_court"
    external_id = scrapy.Field()
    url = scrapy.Field()

    # Core metadata
    title = scrapy.Field()
    citation = scrapy.Field()
    court = scrapy.Field()
    bench = scrapy.Field()
    judge = scrapy.Field()
    date = scrapy.Field()
    case_number = scrapy.Field()
    sections_referenced = scrapy.Field()
    description = scrapy.Field()

    # Content
    full_text = scrapy.Field()
    pdf_url = scrapy.Field()

    # Raw data
    raw_html = scrapy.Field()
    metadata = scrapy.Field()

    def __repr__(self):
        return f"<LegalDocument(source={self.get('source')}, citation={self.get('citation')})>"


class LawSectionItem(scrapy.Item):
    """Item for law/section content."""

    source = scrapy.Field()
    external_id = scrapy.Field()
    url = scrapy.Field()
    law_name = scrapy.Field()
    section_number = scrapy.Field()
    section_text = scrapy.Field()
    related_sections = scrapy.Field()
    source_url = scrapy.Field()
    raw_html = scrapy.Field()
