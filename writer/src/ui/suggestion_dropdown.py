"""Floating suggestion dropdown widget."""

import customtkinter as ctk


class SuggestionDropdown:
    """Floating popup showing up to 5 autocomplete suggestions."""

    def __init__(self, parent):
        self.parent = parent
        self.suggestions: list[str] = []
        self.selected_index: int = -1

        # Create popup window
        self.popup = ctk.CTkToplevel(parent)
        self.popup.withdraw()  # Hide initially

        # Configure popup
        self.popup.attributes('-topmost', True)
        self.popup.configure(fg_color="#2b2b2b")

        # Create frame for suggestions
        self.frame = ctk.CTkFrame(self.popup, fg_color="#2b2b2b")
        self.frame.pack(fill="both")

        # Button references for selection highlighting
        self.buttons: list[ctk.CTkButton] = []

    def show(self, suggestions: list[str], x: int, y: int):
        """Display dropdown at given coordinates."""
        self.suggestions = suggestions
        self.selected_index = -1

        # Clear existing buttons
        for btn in self.buttons:
            btn.destroy()
        self.buttons.clear()

        if not suggestions:
            self.popup.withdraw()
            return

        # Create buttons for each suggestion
        for i, suggestion in enumerate(suggestions):
            btn = ctk.CTkButton(
                self.frame,
                text=suggestion,
                width=200,
                height=30,
                fg_color="transparent",
                hover_color="#3a3a3a",
                command=lambda idx=i: self.select(idx),
                anchor="w"
            )
            btn.pack(fill="x", padx=2, pady=1)
            self.buttons.append(btn)

        # Position popup
        self.popup.geometry(f"+{x}+{y}")
        self.popup.deiconify()

    def hide(self):
        """Hide dropdown."""
        self.popup.withdraw()

    def select_next(self):
        """Navigate to next suggestion."""
        if not self.suggestions:
            return

        if self.selected_index < len(self.suggestions) - 1:
            self.selected_index += 1
            self._update_selection()

    def select_previous(self):
        """Navigate to previous suggestion."""
        if self.selected_index > 0:
            self.selected_index -= 1
            self._update_selection()

    def _update_selection(self):
        """Update visual selection."""
        for i, btn in enumerate(self.buttons):
            if i == self.selected_index:
                btn.configure(fg_color="#0078d4")
            else:
                btn.configure(fg_color="transparent")

    def select(self, index: int):
        """Select suggestion at index."""
        self.selected_index = index
        self._update_selection()

    def get_selected(self) -> str | None:
        """Get currently selected suggestion."""
        if 0 <= self.selected_index < len(self.suggestions):
            return self.suggestions[self.selected_index]
        return None

    def is_visible(self) -> bool:
        """Check if dropdown is visible."""
        return self.popup.winfo_viewable()
