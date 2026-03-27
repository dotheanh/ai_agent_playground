"""In-memory cache for query results."""

from typing import Optional


class CacheManager:
    """Cache query results for performance optimization."""

    def __init__(self, max_size: int = 1000):
        self._cache: dict[str, list[tuple[str, int]]] = {}
        self._max_size = max_size
        self._access_order: list[str] = []

    def get(self, word: str) -> Optional[list[tuple[str, int]]]:
        """Get cached bigrams for word."""
        if word in self._cache:
            # Move to end (most recently used)
            self._access_order.remove(word)
            self._access_order.append(word)
            return self._cache[word]
        return None

    def set(self, word: str, bigrams: list[tuple[str, int]]) -> None:
        """Cache bigrams for word."""
        if word in self._cache:
            self._access_order.remove(word)

        # Evict if at capacity
        if len(self._cache) >= self._max_size:
            oldest = self._access_order.pop(0)
            del self._cache[oldest]

        self._cache[word] = bigrams
        self._access_order.append(word)

    def clear(self) -> None:
        """Clear all cached data."""
        self._cache.clear()
        self._access_order.clear()
