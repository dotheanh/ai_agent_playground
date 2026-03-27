import sqlite3
import os
from src.data.database import init_database, get_db_connection


def test_database_connection():
    """Test that we can connect to the database."""
    conn = get_db_connection()
    assert conn is not None
    conn.close()


def test_database_schema_created():
    """Test that all tables are created on init."""
    db_path = "data/database.db"
    init_database(db_path)

    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # Check tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}

    assert 'word_frequency' in tables
    assert 'bigram_frequency' in tables
    assert 'dictionary' in tables
    assert 'metadata' in tables

    conn.close()
