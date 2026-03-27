"""Dialog components for corpus import and settings."""

import os
import threading
import customtkinter as ctk
from tkinter import filedialog
from src.core.corpus_processor import CorpusProcessor
from src.data.database import batch_update_frequencies


class ImportCorpusDialog:
    """Dialog for importing text corpus."""

    def __init__(self, parent, on_complete=None):
        self.on_complete = on_complete
        self.folder_path = ""
        self.parent = parent
        self.dialog = None

        # Create dialog window
        self.dialog = ctk.CTkToplevel(parent)
        self.dialog.title("Import Text Corpus")
        self.dialog.geometry("500x250")
        self.dialog.transient(parent)
        self.dialog.grab_set()

        # Frame
        frame = ctk.CTkFrame(self.dialog)
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Label
        label = ctk.CTkLabel(
            frame,
            text="Select folder containing .txt files to import as corpus"
        )
        label.pack(pady=10)

        # Path entry and button
        path_frame = ctk.CTkFrame(frame, fg_color="transparent")
        path_frame.pack(fill="x", padx=10, pady=5)

        self.path_entry = ctk.CTkEntry(path_frame, width=350)
        self.path_entry.pack(side="left", padx=5)

        browse_btn = ctk.CTkButton(
            path_frame,
            text="Browse",
            width=80,
            command=self._browse_folder
        )
        browse_btn.pack(side="left", padx=5)

        # Import button
        self.import_btn = ctk.CTkButton(
            frame,
            text="Import Corpus",
            command=self._import,
            state="disabled"
        )
        self.import_btn.pack(pady=10)

        # Progress label (hidden initially)
        self.progress_label = ctk.CTkLabel(frame, text="", text_color="#00ff00")
        self.progress_label.pack(pady=5)

    def _browse_folder(self):
        """Open folder browser dialog."""
        folder = filedialog.askdirectory()
        if folder:
            self.folder_path = folder
            self.path_entry.delete(0, "end")
            self.path_entry.insert(0, folder)
            self.import_btn.configure(state="normal")

    def _import(self):
        """Import corpus from selected folder in background thread."""
        if not self.folder_path:
            return

        # Disable UI during processing
        self.import_btn.configure(state="disabled")
        self.progress_label.configure(text="Processing... Please wait.")

        # Run in background thread
        thread = threading.Thread(target=self._process_corpus, daemon=True)
        thread.start()

    def _process_corpus(self):
        """Process corpus in background and update UI on completion."""
        try:
            # Process corpus
            processor = CorpusProcessor()
            word_freq, bigram_freq = processor.process_corpus_folder(self.folder_path)

            # Batch update database (much faster)
            batch_update_frequencies(word_freq, bigram_freq)

            # Update UI on main thread
            self.parent.after(0, lambda: self._on_complete(
                word_freq, bigram_freq
            ))
        except Exception as e:
            # Handle error on main thread
            self.parent.after(0, lambda: self._on_error(str(e)))

    def _on_complete(self, word_freq, bigram_freq):
        """Handle successful import on UI thread."""
        result = {
            "success": True,
            "words": len(word_freq),
            "bigrams": len(bigram_freq)
        }
        self.progress_label.configure(
            text=f"✓ Imported {len(word_freq)} words, {len(bigram_freq)} bigrams!",
            text_color="#00ff00"
        )
        self.on_complete(result)
        self.dialog.destroy()

    def _on_error(self, error_msg):
        """Handle error on UI thread."""
        self.progress_label.configure(text=f"✗ Error: {error_msg}", text_color="#ff0000")
        self.import_btn.configure(state="normal")
