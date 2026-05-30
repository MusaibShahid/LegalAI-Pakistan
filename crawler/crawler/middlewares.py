from scrapy import signals


class SourceMiddleware:
    """Middleware to handle source-specific headers and rate limiting."""

    @classmethod
    def from_crawler(cls, crawler):
        mw = cls()
        crawler.signals.connect(mw.spider_opened, signal=signals.spider_opened)
        return mw

    def process_request(self, request, spider):
        # Add source-specific headers
        source_headers = getattr(spider, "custom_headers", {})
        for key, value in source_headers.items():
            request.headers[key] = value
        return None

    def spider_opened(self, spider):
        spider.logger.info(f"Spider opened: {spider.name}")
