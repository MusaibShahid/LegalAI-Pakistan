import time
import json
import hashlib
import logging
from collections import OrderedDict
from typing import Optional, Any

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """In-memory LRU cache with TTL and size limit for search results."""

    def __init__(self, max_size: int = 1000):
        self._cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._max_size = max_size

    def _make_key(self, prefix: str, data: str) -> str:
        hash_val = hashlib.sha256(data.encode()).hexdigest()[:16]
        return f"{prefix}:{hash_val}"

    async def get(self, prefix: str, key_data: str) -> Optional[Any]:
        key = self._make_key(prefix, key_data)
        if key in self._cache:
            value, expiry = self._cache[key]
            if expiry > time.time():
                self._cache.move_to_end(key)
                return value
            del self._cache[key]
        return None

    async def set(self, prefix: str, key_data: str, value: Any, ttl: int = None) -> None:
        key = self._make_key(prefix, key_data)
        if key in self._cache:
            del self._cache[key]
        elif len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)
        self._cache[key] = (value, time.time() + (ttl or settings.cache_ttl_seconds))

    async def invalidate(self, prefix: str, key_data: str) -> None:
        key = self._make_key(prefix, key_data)
        self._cache.pop(key, None)

    async def clear(self) -> None:
        self._cache.clear()

    async def close(self) -> None:
        self._cache.clear()


cache_service = CacheService()
