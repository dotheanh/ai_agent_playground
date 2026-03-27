#!/usr/bin/env python3
"""Import Vietnamese dictionary into database."""

import sqlite3

def import_dictionary():
    db_path = "data/database.db"
    dict_path = "data/vietnamese_dict.txt"

    # Connect
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Clear existing dictionary
    c.execute("DELETE FROM dictionary")
    conn.commit()

    # Read plain text dictionary
    with open(dict_path, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    # Insert
    c.executemany("INSERT INTO dictionary (word) VALUES (?)", [(w,) for w in words])
    conn.commit()

    # Count
    c.execute("SELECT COUNT(*) FROM dictionary")
    count = c.fetchone()[0]

    print(f"Imported {count} words into dictionary")
    conn.close()

if __name__ == "__main__":
    import_dictionary()
