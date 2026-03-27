"""Suggestion engine for autocomplete."""

import sqlite3
from typing import Optional
from src.core.cache_manager import CacheManager


class SuggestionEngine:
    """Generate autocomplete suggestions based on corpus statistics."""

    # Vietnamese vowel variant groups (lower + upper)
    _VOWEL_GROUPS = [
        "aàáạảãăằắặẳẵâầấậẩẫ",
        "AÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪ",
        "eèéẹẻẽêềếệểễ",
        "EÈÉẸẺẼÊỀẾỆỂỄ",
        "iìíịỉĩ",
        "IÌÍỊỈĨ",
        "oòóọỏõôồốộổỗơờớợởỡ",
        "OÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ",
        "uùúụủũưừứựửữ",
        "UÙÚỤỦŨƯỪỨỰỬỮ",
        "yỳýỵỷỹ",
        "YỲÝỴỶỸ",
    ]

    def __init__(self, db_path: Optional[str] = None):
        self._db_path = db_path or "data/database.db"
        self._cache = CacheManager(max_size=1000)

    def get_suggestions(self, context: str, prefix: str) -> list[str]:
        """
        Get autocomplete suggestions.

        Returns up to 5 suggestions:
        1) Corpus bigrams first
        2) Fill remaining from dictionary
        3) If last typed char is a vowel, match Vietnamese vowel variants too
        """
        previous_word = self._extract_previous_word(context)
        if not previous_word:
            return self._collect_dictionary_only(prefix)

        prefix_variants = self._expand_last_vowel_variants(prefix)

        # corpus candidates
        bigrams = self._get_bigrams(previous_word)
        filtered = [
            (w2, f) for w2, f in bigrams
            if self._starts_with_any_prefix(w2, prefix_variants)
        ]
        filtered.sort(key=lambda x: x[1], reverse=True)

        suggestions: list[str] = []
        for word2, _freq in filtered:
            clean_word = self._clean_word(word2)
            if clean_word and clean_word not in suggestions:
                suggestions.append(clean_word)
            if len(suggestions) >= 5:
                return suggestions[:5]

        # dictionary fallback to fill to 5 (with vowel-variant expansion)
        for variant in prefix_variants:
            for word in self._get_dictionary_words(variant):
                clean_word = self._clean_word(word)
                if clean_word and clean_word not in suggestions:
                    suggestions.append(clean_word)
                if len(suggestions) >= 5:
                    return suggestions[:5]

        return suggestions[:5]

    def get_next_word_suggestions(self, context: str) -> list[str]:
        """Get suggestions right after user presses space (prefix empty)."""
        previous_word = self._extract_previous_word(context)
        if not previous_word:
            return self._collect_dictionary_only("")

        suggestions: list[str] = []

        # corpus-first
        bigrams = self._get_bigrams(previous_word)
        for word2, freq in sorted(bigrams, key=lambda x: x[1], reverse=True):
            clean = self._clean_word(word2)
            if clean and clean not in suggestions:
                suggestions.append(clean)
            if len(suggestions) >= 5:
                return suggestions[:5]

        # dictionary fallback
        for word in self._get_dictionary_words(""):
            clean = self._clean_word(word)
            if clean and clean not in suggestions:
                suggestions.append(clean)
            if len(suggestions) >= 5:
                break

        return suggestions[:5]

    # -----------------------------
    # Matching helpers
    # -----------------------------
    def _starts_with_any_prefix(self, word: str, prefixes: list[str]) -> bool:
        if not prefixes:
            return True
        for p in prefixes:
            if word.startswith(p):
                return True
        return False

    def _expand_last_vowel_variants(self, prefix: str) -> list[str]:
        """
        Expand only LAST char when it's a vowel to Vietnamese variants.
        Example: "na" -> ["na", "nà", "ná", ... "nâ", "nă", ...]
        """
        if not prefix:
            return [""]

        last_char = prefix[-1]
        group = self._get_vowel_group(last_char)
        if not group:
            return [prefix]

        head = prefix[:-1]
        variants = [prefix]  # keep original first
        for ch in group:
            cand = head + ch
            if cand not in variants:
                variants.append(cand)
        return variants

    def _get_vowel_group(self, ch: str) -> str:
        for group in self._VOWEL_GROUPS:
            if ch in group:
                return group
        return ""

    # -----------------------------
    # DB + normalization
    # -----------------------------
    def _extract_previous_word(self, context: str) -> str:
        """Extract the last word from context (case-sensitive)."""
        context = context.strip()
        if not context:
            return ""
        words = context.split()
        return words[-1] if words else ""

    def _clean_word(self, word: str) -> str:
        """Remove trailing punctuation from suggestion words."""
        while word and word[-1] in ".,;:!?":
            word = word[:-1]
        return word

    def _get_bigrams(self, word: str) -> list[tuple[str, int]]:
        """Get bigrams for word from database or cache (case-sensitive)."""
        cached = self._cache.get(word)
        if cached is not None:
            return cached

        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT word2, freq FROM bigram_frequency
            WHERE word1 = ?
            ORDER BY freq DESC
            """,
            (word,),
        )
        results = [(row[0], row[1]) for row in cursor.fetchall()]
        conn.close()

        self._cache.set(word, results)
        return results

    def _get_dictionary_words(self, prefix: str) -> list[str]:
        """Get dictionary words by prefix (case-insensitive)."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        if prefix:
            cursor.execute(
                """
                SELECT word FROM dictionary
                WHERE LOWER(word) LIKE LOWER(?)
                ORDER BY word
                LIMIT 300
                """,
                (f"{prefix}%",),
            )
        else:
            cursor.execute(
                """
                SELECT word FROM dictionary
                ORDER BY LENGTH(word), word
                LIMIT 300
                """
            )

        results = [row[0] for row in cursor.fetchall()]
        conn.close()
        return results

    def _collect_dictionary_only(self, prefix: str) -> list[str]:
        """Collect dictionary-only suggestions with vowel-variant expansion."""
        suggestions: list[str] = []
        for variant in self._expand_last_vowel_variants(prefix):
            for word in self._get_dictionary_words(variant):
                clean = self._clean_word(word)
                if clean and clean not in suggestions:
                    suggestions.append(clean)
                if len(suggestions) >= 5:
                    return suggestions[:5]
        return suggestions[:5]

    def add_bigram(self, word1: str, word2: str, freq: int) -> None:
        """Add or update bigram (for testing)."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO bigram_frequency (word1, word2, freq)
            VALUES (?, ?, ?)
            ON CONFLICT(word1, word2) DO UPDATE SET freq = freq + ?
            """,
            (word1, word2, freq, freq),
        )
        conn.commit()
        conn.close()
        self._cache.clear()

    def reload(self) -> None:
        """Reload suggestions - clear cache to pick up new corpus data."""
        self._cache.clear()
        print("[DEBUG] SuggestionEngine cache cleared!")
