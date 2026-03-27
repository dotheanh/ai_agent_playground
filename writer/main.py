"""Vietnamese Autocomplete Writer - Main entry point."""

import os
import sqlite3
import customtkinter as ctk
from src.data.database import init_database
from src.data.dictionary import load_dictionary_from_file
from src.ui.main_window import MainWindow


def _ensure_dictionary_loaded() -> None:
    """Load dictionary into DB if empty (for proper fallback suggestions)."""
    db_path = "data/database.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM dictionary")
    count = cursor.fetchone()[0]
    conn.close()

    if count == 0:
        dict_path = "data/vietnamese_dict.txt"
        if os.path.exists(dict_path):
            loaded = load_dictionary_from_file(dict_path, db_path=db_path)
            print(f"[DEBUG] Loaded dictionary words: {loaded}")
        else:
            print("[DEBUG] Dictionary file not found, fallback suggestions may be limited")


def main():
    """Initialize and run the application."""
    # Initialize database
    init_database()
    _ensure_dictionary_loaded()

    # Configure CTk appearance
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")

    # Create and run main window
    app = MainWindow()
    app.mainloop()


if __name__ == "__main__":
    main()
