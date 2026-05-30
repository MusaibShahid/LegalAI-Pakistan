BOT_NAME = "plse_crawler"

SPIDER_MODULES = ["crawler.spiders"]
NEWSPIDER_MODULE = "crawler.spiders"

# Obey robots.txt
ROBOTSTXT_OBEY = False

# Configure delays
DOWNLOAD_DELAY = 2.0
RANDOMIZE_DOWNLOAD_DELAY = True
CONCURRENT_REQUESTS_PER_DOMAIN = 4

# User agent
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Item pipelines
ITEM_PIPELINES = {
    "crawler.pipelines.MetadataPipeline": 300,
}

# Enable caching
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 86400
HTTPCACHE_DIR = "httpcache"

# Downloader settings
DOWNLOADER_MIDDLEWARES = {
    "crawler.middlewares.SourceMiddleware": 543,
}
