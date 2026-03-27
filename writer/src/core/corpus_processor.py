"""Corpus processor for text preprocessing and n-gram extraction."""

import re
import os
from collections import Counter
from typing import Optional


def simple_segment(text: str) -> list[str]:
    """Simple space-based tokenization as fallback."""
    return text.split()


class CorpusProcessor:
    """Process text corpus for n-gram statistics."""

    def __init__(self):
        self._segment = simple_segment

    def normalize_text(self, text: str) -> str:
        """
        Normalize text:
        - Replace multiple spaces with single space
        - Replace multiple newlines with single newline
        - Normalize punctuation spacing
        """
        # Multiple spaces -> single space
        text = re.sub(r' +', ' ', text)

        # Multiple newlines -> single newline
        text = re.sub(r'\n+', '\n', text)

        # Remove leading/trailing whitespace
        text = text.strip()

        return text

    def tokenize(self, text: str) -> list[str]:
        """
        Tokenize Vietnamese text.
        Returns list of words/phrases (case-sensitive, no lowercase).
        """
        # Normalize first
        text = self.normalize_text(text)

        # Use simple segmentation (space-based)
        tokens = self._segment(text)

        # Filter empty tokens but KEEP original case
        tokens = [t.strip() for t in tokens if t.strip()]

        return tokens

    def extract_ngrams(self, tokens: list[str], n: int) -> list[tuple]:
        """
        Extract n-grams from token list.
        Returns list of (word1, word2, ...) tuples.
        """
        if len(tokens) < n:
            return []

        ngrams = []
        for i in range(len(tokens) - n + 1):
            ngram = tuple(tokens[i:i + n])
            ngrams.append(ngram)

        return ngrams

    def process_text(self, text: str) -> tuple[dict[str, int], dict[tuple[str, str], int]]:
        """
        Process text and return word/bigram frequencies.

        Returns:
            (word_freq, bigram_freq) where each is a Counter-like dict
        """
        tokens = self.tokenize(text)

        # Count unigrams
        word_freq = Counter(tokens)

        # Count bigrams
        bigrams = self.extract_ngrams(tokens, 2)
        bigram_freq = Counter(bigrams)

        return dict(word_freq), dict(bigram_freq)

    def process_corpus_file(self, file_path: str) -> tuple[dict[str, int], dict[tuple[str, str], int]]:
        """
        Process a single .txt file.

        Returns:
            (word_freq, bigram_freq)
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()

        return self.process_text(text)

    def process_corpus_folder(self, folder_path: str) -> tuple[dict[str, int], dict[tuple[str, str], int]]:
        """
        Process all .txt files in a folder.

        Returns:
            (word_freq, bigram_freq) aggregated from all files
        """
        total_word_freq = {}
        total_bigram_freq = {}

        txt_files = [f for f in os.listdir(folder_path) if f.endswith('.txt')]

        for filename in txt_files:
            file_path = os.path.join(folder_path, filename)
            word_freq, bigram_freq = self.process_corpus_file(file_path)

            # Manual merge for speed
            for word, freq in word_freq.items():
                total_word_freq[word] = total_word_freq.get(word, 0) + freq

            for bigram, freq in bigram_freq.items():
                total_bigram_freq[bigram] = total_bigram_freq.get(bigram, 0) + freq

        return total_word_freq, total_bigram_freq
