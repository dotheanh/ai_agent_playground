"""Main application window."""

import customtkinter as ctk
from src.ui.text_editor import TextEditor
from src.ui.dialogs import ImportCorpusDialog


class MainWindow(ctk.CTk):
    """Main application window."""

    def __init__(self):
        super().__init__()

        self.title("Vietnamese Autocomplete Writer")
        self.geometry("1000x700")

        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Menu bar
        self._create_menu()

        # Text editor
        self.editor = TextEditor(
            self,
            corner_radius=0,
            border_width=0,
            text_color="#ffffff",
            fg_color="#1e1e1e"
        )
        self.editor.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)

        # Status bar
        self.status_label = ctk.CTkLabel(
            self,
            text="Ready - Import corpus to start",
            anchor="w"
        )
        self.status_label.grid(row=2, column=0, sticky="w", padx=10, pady=5)

    def _create_menu(self):
        """Create menu bar."""
        menubar = ctk.CTkFrame(self, height=40, fg_color="transparent")
        menubar.grid(row=0, column=0, sticky="ew")

        # Import button
        import_btn = ctk.CTkButton(
            menubar,
            text="Import Corpus",
            width=100,
            command=self._show_import_dialog
        )
        import_btn.pack(side="left", padx=5)

    def _show_import_dialog(self):
        """Show import corpus dialog."""
        def on_complete(result):
            if result.get("success"):
                self.status_label.configure(
                    text=f"Imported {result['words']} words, {result['bigrams']} bigrams"
                )
                # Reload suggestion engine to pick up new corpus data
                if result.get("reload_engine"):
                    self.editor.suggestion_engine.reload()
                    print("[DEBUG] Suggestion engine reloaded!")

        dialog = ImportCorpusDialog(self, on_complete=on_complete)
        dialog.dialog.wait_window()
