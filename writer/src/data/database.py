"""Database layer for Vietnamese autocomplete writer."""

import sqlite3
import os
from typing import Optional

DATABASE_PATH = "data/database.db"


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Get database connection with row factory for dict-like access."""
    path = db_path or DATABASE_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_database(db_path: Optional[str] = None) -> None:
    """Initialize database with schema."""
    path = db_path or DATABASE_PATH

    # Ensure data directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)

    conn = get_db_connection(path)
    cursor = conn.cursor()

    # word_frequency: unigram statistics
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS word_frequency (
            word TEXT PRIMARY KEY,
            freq INTEGER NOT NULL DEFAULT 0
        )
    """)

    # bigram_frequency: pair statistics
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bigram_frequency (
            word1 TEXT NOT NULL,
            word2 TEXT NOT NULL,
            freq INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (word1, word2)
        )
    """)

    # Create index for fast bigram lookup
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_bigram_word1
        ON bigram_frequency(word1)
    """)

    # dictionary: Vietnamese fallback words
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dictionary (
            word TEXT PRIMARY KEY,
            pos TEXT
        )
    """)

    # metadata: system metadata
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def update_word_frequency(word: str, freq: int, db_path: Optional[str] = None) -> None:
    """Update or insert word frequency."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO word_frequency (word, freq) VALUES (?, ?)
        ON CONFLICT(word) DO UPDATE SET freq = freq + ?
    """, (word, freq, freq))

    conn.commit()
    conn.close()


def update_bigram_frequency(word1: str, word2: str, freq: int, db_path: Optional[str] = None) -> None:
    """Update or insert bigram frequency."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO bigram_frequency (word1, word2, freq) VALUES (?, ?, ?)
        ON CONFLICT(word1, word2) DO UPDATE SET freq = freq + ?
    """, (word1, word2, freq, freq))

    conn.commit()
    conn.close()


def get_bigrams_for_word(word: str, db_path: Optional[str] = None) -> list[tuple[str, int]]:
    """Get all bigrams starting with given word, sorted by frequency."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT word2, freq FROM bigram_frequency
        WHERE word1 = ?
        ORDER BY freq DESC
    """, (word,))

    results = [(row['word2'], row['freq']) for row in cursor.fetchall()]
    conn.close()

    return results


def get_dictionary_words_starting_with(prefix: str, db_path: Optional[str] = None) -> list[str]:
    """Get dictionary words starting with prefix."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT word FROM dictionary
        WHERE word LIKE ?
        ORDER BY word
    """, (f"{prefix}%",))

    results = [row['word'] for row in cursor.fetchall()]
    conn.close()

    return results


def batch_update_frequencies(word_freq: dict[str, int], bigram_freq: dict[tuple[str, str], int]) -> None:
    """
    Batch update word and bigram frequencies in a single transaction.
    Much faster than individual updates.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Begin transaction
        cursor.execute("BEGIN")

        # Batch insert word frequencies (use INSERT OR REPLACE pattern)
        for word, freq in word_freq.items():
            cursor.execute("""
                INSERT INTO word_frequency (word, freq) VALUES (?, ?)
                ON CONFLICT(word) DO UPDATE SET freq = freq + ?
            """, (word, freq, freq))

        # Batch insert bigram frequencies
        for (w1, w2), freq in bigram_freq.items():
            cursor.execute("""
                INSERT INTO bigram_frequency (word1, word2, freq) VALUES (?, ?, ?)
                ON CONFLICT(word1, word2) DO UPDATE SET freq = freq + ?
            """, (w1, w2, freq, freq))

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def get_metadata(key: str, db_path: Optional[str] = None) -> Optional[str]:
    """Get metadata value by key."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("SELECT value FROM metadata WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()

    return row['value'] if row else None


def set_metadata(key: str, value: str, db_path: Optional[str] = None) -> None:
    """Set metadata key-value pair."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO metadata (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = ?
    """, (key, value, value))

    conn.commit()
    conn.close()


def get_corpus_stats(db_path: Optional[str] = None) -> dict:
    """Get corpus statistics."""
    path = db_path or DATABASE_PATH
    conn = get_db_connection(path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM word_frequency")
    word_count = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM bigram_frequency")
    bigram_count = cursor.fetchone()['count']

    conn.close()

    return {
        'word_count': word_count,
        'bigram_count': bigram_count
    }
