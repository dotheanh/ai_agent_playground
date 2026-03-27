"""Dialog components for corpus import and settings."""

import os
import customtkinter as ctk
from tkinter import filedialog
from src.core.corpus_processor import CorpusProcessor
from src.data.database import update_word_frequency, update_bigram_frequency


class ImportCorpusDialog(ctk.CTkDialog):
    """Dialog for importing text corpus."""

    def __init__(self, parent, on_complete=None):
        super().__init__(parent)

        self.on_complete = on_complete
        self.folder_path = ""

        self.title("Import Text Corpus")
        self.geometry("500x200")

        # Frame
        frame = ctk.CTkFrame(self)
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

    def _browse_folder(self):
        """Open folder browser dialog."""
        folder = filedialog.askdirectory()
        if folder:
            self.folder_path = folder
            self.path_entry.insert(0, folder)
            self.import_btn.configure(state="normal")

    def _import(self):
        """Import corpus from selected folder."""
        if not self.folder_path:
            return

        # Process corpus
        processor = CorpusProcessor()
        word_freq, bigram_freq = processor.process_corpus_folder(self.folder_path)

        # Update database
        for word, freq in word_freq.items():
            update_word_frequency(word, freq)

        for (word1, word2), freq in bigram_freq.items():
            update_bigram_frequency(word1, word2, freq)

        # Close dialog with success
        self.result = {
            "success": True,
            "words": len(word_freq),
            "bigrams": len(bigram_freq)
        }
        self.on_complete(self.result)
        self.destroy()
