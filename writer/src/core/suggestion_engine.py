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

    def get_suggestions(self, context: str, prefix: str) -> list[tuple[str, bool]]:
        """
        Get autocomplete suggestions.

        Returns up to 8 suggestions as tuples: (word, is_from_dictionary)
        Priority:
        1. Bigram from corpus (previous_word + prefix) - up to 5
        2. Bigram from dictionary (previous_word + prefix) - up to 2
        3. Single word from dictionary - up to 1
        """
        previous_word = self._extract_previous_word(context)
        if not previous_word:
            return self._collect_dictionary_only(prefix)

        prefix_variants = self._expand_last_vowel_variants(prefix)
        suggestions: list[tuple[str, bool]] = []

        # Step 1: Get bigram from corpus (previous_word + prefix)
        # Always get bigrams when there's a previous_word (even with empty prefix)
        bigrams = self._get_bigrams(previous_word)
        if prefix:
            filtered = [
                (w2, f) for w2, f in bigrams
                if self._starts_with_any_prefix(w2, prefix_variants)
            ]
        else:
            # No prefix - return all bigrams sorted by frequency
            filtered = bigrams
        filtered.sort(key=lambda x: x[1], reverse=True)

        for word2, _freq in filtered:
            clean_word = self._clean_word(word2)
            if clean_word and clean_word not in [w for w, _ in suggestions]:
                suggestions.append((clean_word, False))  # from corpus
            if len(suggestions) >= 5:
                break

        # Step 2: Get bigram from dictionary (previous_word + prefix)
        if len(suggestions) < 7 and prefix:
            for variant in prefix_variants:
                dict_bigrams = self._get_dictionary_bigrams(previous_word, variant)
                for word, _freq in dict_bigrams:
                    clean_word = self._clean_word(word)
                    # Filter by prefix (case-sensitive for dictionary bigrams)
                    if clean_word and clean_word.startswith(prefix) and clean_word not in [w for w, _ in suggestions]:
                        suggestions.append((clean_word, True))  # from dictionary bigrams
                    if len(suggestions) >= 7:
                        break
                if len(suggestions) >= 7:
                    break

        # Step 3: Get single word from dictionary if needed
        if len(suggestions) < 8 and prefix:
            for variant in prefix_variants:
                single_words = self._get_dictionary_single_words(variant)
                for word in single_words:
                    clean_word = self._clean_word(word)
                    # Filter by prefix (case-sensitive for dictionary single words)
                    if clean_word and clean_word.startswith(prefix) and clean_word not in [w for w, _ in suggestions]:
                        suggestions.append((clean_word, True))  # from dictionary single words
                    if len(suggestions) >= 8:
                        break
                if len(suggestions) >= 8:
                    break

        return suggestions[:8]

    def get_next_word_suggestions(self, context: str) -> list[tuple[str, bool]]:
        """Get suggestions right after user presses space (prefix empty)."""
        previous_word = self._extract_previous_word(context)
        if not previous_word:
            return self._collect_dictionary_only("")

        suggestions: list[tuple[str, bool]] = []

        # Get up to 5 from corpus (by frequency)
        bigrams = self._get_bigrams(previous_word)
        for word2, freq in sorted(bigrams, key=lambda x: x[1], reverse=True):
            clean = self._clean_word(word2)
            if clean and clean not in [w for w, _ in suggestions]:
                suggestions.append((clean, False))  # from corpus
            if len(suggestions) >= 5:
                break

        # Add multi-words from dictionary (alphabetically)
        for word in self._get_dictionary_multi_words(""):
            clean = self._clean_word(word)
            if clean and len(suggestions) < 7:
                if clean not in [w for w, _ in suggestions]:
                    suggestions.append((clean, True))  # from dictionary multi-words
            if len(suggestions) >= 7:
                break

        # Add single words if needed
        for word in self._get_dictionary_single_words(""):
            clean = self._clean_word(word)
            if clean and len(suggestions) < 8:
                if clean not in [w for w, _ in suggestions]:
                    suggestions.append((clean, True))  # from dictionary single words
            if len(suggestions) >= 8:
                break

        return suggestions[:8]

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
        Expand only LAST char when it's a TONELESS lowercase vowel (u e o a i y) to Vietnamese variants.
        If last char is already accented, keep it as-is (no variant expansion).
        Example: "na" -> ["na", "nà", "ná", ... "nâ", "nă", ...]
        Example: "tự" -> ["tự"] (no expansion because 'ự' is already accented)
        """
        if not prefix:
            return [""]

        last_char = prefix[-1]

        # Only expand for toneless lowercase vowels: a, e, i, o, u, y
        toneless_vowels = "aeoiuyAEIOUY"
        if last_char not in toneless_vowels:
            return [prefix]

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

    def _get_dictionary_multi_words(self, prefix: str) -> list[str]:
        """Get multi-words (phrases) from dictionary by prefix (case-insensitive)."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        if prefix:
            cursor.execute(
                """
                SELECT word FROM dictionary_multi_words
                WHERE LOWER(word) LIKE LOWER(?) AND word LIKE '% %'
                ORDER BY word
                LIMIT 100
                """,
                (f"{prefix}%",),
            )
        else:
            cursor.execute(
                """
                SELECT word FROM dictionary_multi_words
                WHERE word LIKE '% %'
                ORDER BY LENGTH(word), word
                LIMIT 100
                """
            )

        results = [row[0] for row in cursor.fetchall()]
        conn.close()
        return results

    def _get_dictionary_single_words(self, prefix: str) -> list[str]:
        """Get single words from dictionary by prefix (case-insensitive)."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        if prefix:
            cursor.execute(
                """
                SELECT word FROM dictionary
                WHERE LOWER(word) LIKE LOWER(?) AND word NOT LIKE '% %'
                ORDER BY word
                LIMIT 100
                """,
                (f"{prefix}%",),
            )
        else:
            cursor.execute(
                """
                SELECT word FROM dictionary
                WHERE word NOT LIKE '% %'
                ORDER BY LENGTH(word), word
                LIMIT 100
                """
            )

        results = [row[0] for row in cursor.fetchall()]
        conn.close()
        return results

    def _get_dictionary_bigrams(self, word1: str, prefix: str) -> list[tuple[str, int]]:
        """Get dictionary bigrams for (word1 + prefix)."""
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT word2, freq FROM dictionary_bigrams
            WHERE word1 = ? AND LOWER(word2) LIKE LOWER(?)
            ORDER BY freq DESC
            """,
            (word1, f"{prefix}%"),
        )
        results = [(row[0], row[1]) for row in cursor.fetchall()]
        conn.close()
        return results

    def _collect_dictionary_only(self, prefix: str) -> list[tuple[str, bool]]:
        """Collect dictionary-only suggestions with vowel-variant expansion."""
        suggestions: list[tuple[str, bool]] = []
        for variant in self._expand_last_vowel_variants(prefix):
            for word in self._get_dictionary_words(variant):
                clean = self._clean_word(word)
                if clean and clean not in [w for w, _ in suggestions]:
                    suggestions.append((clean, True))  # always from dictionary
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
