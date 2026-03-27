"""Vietnamese Autocomplete Writer - Main entry point."""

import customtkinter as ctk
from src.data.database import init_database
from src.ui.main_window import MainWindow


def main():
    """Initialize and run the application."""
    # Initialize database
    init_database()

    # Configure CTk appearance
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")

    # Create and run main window
    app = MainWindow()
    app.mainloop()


if __name__ == "__main__":
    main()
