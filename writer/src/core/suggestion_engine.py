"""Suggestion engine for autocomplete."""

import sqlite3
from typing import Optional
from src.core.cache_manager import CacheManager


class SuggestionEngine:
    """Generate autocomplete suggestions based on corpus statistics."""

    def __init__(self, db_path: Optional[str] = None):
        self._db_path = db_path or "data/database.db"
        self._cache = CacheManager(max_size=1000)

    def get_suggestions(self, context: str, prefix: str) -> list[str]:
        """
        Get autocomplete suggestions.

        Args:
            context: Text before cursor (e.g., "lam ")
            prefix: Current word being typed (e.g., "v")

        Returns:
            List of up to 5 suggestion strings
        """
        # Extract previous word from context
        previous_word = self._extract_previous_word(context)

        if not previous_word:
            return []

        # Get bigrams for previous word
        bigrams = self._get_bigrams(previous_word)

        # Filter by prefix
        filtered = [
            (word2, freq) for word2, freq in bigrams
            if word2.startswith(prefix)
        ]

        # Sort by frequency
        filtered.sort(key=lambda x: x[1], reverse=True)

        # Collect suggestions
        suggestions = [word2 for word2, freq in filtered]

        # Fallback to dictionary if < 5
        if len(suggestions) < 5 and prefix:
            dict_words = self._get_dictionary_words(prefix)
            for word in dict_words:
                if word not in suggestions:
                    suggestions.append(word)
                if len(suggestions) >= 5:
                    break

        return suggestions[:5]

    def _extract_previous_word(self, context: str) -> str:
        """Extract the last word from context."""
        context = context.strip()
        if not context:
            return ""

        # Split by spaces and get last token
        words = context.split()
        if not words:
            return ""

        return words[-1].lower()

    def _get_bigrams(self, word: str) -> list[tuple[str, int]]:
        """Get bigrams for word from database or cache."""
        # Check cache first
        cached = self._cache.get(word)
        if cached is not None:
            return cached

        # Query database
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT word2, freq FROM bigram_frequency
            WHERE word1 = ?
            ORDER BY freq DESC
        """, (word,))

        results = [(row[0], row[1]) for row in cursor.fetchall()]
        conn.close()

        # Cache result
        self._cache.set(word, results)

        return results

    def _get_dictionary_words(self, prefix: str) -> list[str]:
        """Get dictionary words starting with prefix."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT word FROM dictionary
            WHERE word LIKE ?
            ORDER BY word
        """, (f"{prefix}%",))

        results = [row[0] for row in cursor.fetchall()]
        conn.close()

        return results

    def add_bigram(self, word1: str, word2: str, freq: int) -> None:
        """Add or update bigram (for testing)."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO bigram_frequency (word1, word2, freq)
            VALUES (?, ?, ?)
            ON CONFLICT(word1, word2) DO UPDATE SET freq = freq + ?
        """, (word1, word2, freq, freq))

        conn.commit()
        conn.close()

        # Invalidate cache
        self._cache.clear()

    def reload(self) -> None:
        """Reload suggestions - clear cache to pick up new corpus data."""
        self._cache.clear()
        print("[DEBUG] SuggestionEngine cache cleared!")
