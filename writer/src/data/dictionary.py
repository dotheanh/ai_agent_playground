"""Vietnamese dictionary loader and manager."""

import sqlite3
from typing import Optional


def load_dictionary_from_file(file_path: str, db_path: Optional[str] = None) -> int:
    """
    Load Vietnamese dictionary from text file.

    Expected file format (one word per line):
    việc
    vui
    văn
    ...

    Returns:
        Number of words loaded
    """
    path = db_path or "data/database.db"
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    count = 0
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            word = line.strip().lower()
            if word:
                cursor.execute("""
                    INSERT OR IGNORE INTO dictionary (word, pos)
                    VALUES (?, ?)
                """, (word, 'unknown'))
                count += 1

    conn.commit()
    conn.close()

    return count


def word_exists_in_dictionary(word: str, db_path: Optional[str] = None) -> bool:
    """Check if word exists in dictionary."""
    path = db_path or "data/database.db"
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 1 FROM dictionary WHERE word = ?
    """, (word.lower(),))

    result = cursor.fetchone() is not None
    conn.close()

    return result
