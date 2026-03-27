"""Custom text editor with autocomplete support."""

import customtkinter as ctk
from src.ui.suggestion_dropdown import SuggestionDropdown
from src.core.suggestion_engine import SuggestionEngine


class TextEditor(ctk.CTkTextbox):
    """Text widget with Vietnamese autocomplete support."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.suggestion_engine = SuggestionEngine()
        self.suggestion_dropdown = SuggestionDropdown(self)

        # Bind key events
        self.bind("<KeyRelease>", self._on_key_release)
        self.bind("<Tab>", self._on_tab)
        self.bind("<Return>", self._on_return)
        self.bind("<Up>", self._on_up)
        self.bind("<Down>", self._on_down)
        self.bind("<Escape>", self._on_escape)

    def _on_key_release(self, event):
        """Handle key release for autocomplete trigger."""
        # Ignore modifier keys
        if event.state & 0xff0000:  # Control, Alt, Shift
            return

        # Get current text and cursor position
        content = self.get("1.0", "end-1c")
        cursor_pos = self.index("insert")

        # Get text before cursor
        lines = content.split("\n")
        current_line_idx = int(cursor_pos.split(".")[0]) - 1
        current_col = int(cursor_pos.split(".")[1])

        if current_line_idx < len(lines):
            text_before_cursor = lines[current_line_idx][:current_col]
        else:
            text_before_cursor = ""

        # Get all text before cursor for context
        all_text_before = "\n".join(lines[:current_line_idx])
        if all_text_before:
            all_text_before += "\n"
        all_text_before += text_before_cursor

        # Extract context and prefix
        words = all_text_before.split()
        if not words:
            self.suggestion_dropdown.hide()
            return

        # Simple prefix detection
        last_word = words[-1]
        context = " ".join(words[:-1]) + " " if len(words) > 1 else ""
        prefix = last_word

        # Get suggestions
        suggestions = self.suggestion_engine.get_suggestions(context, prefix)

        if suggestions:
            # Get cursor coordinates
            try:
                bbox = self.bbox(cursor_pos)
                if bbox:
                    x = self.winfo_rootx() + bbox[0]
                    y = self.winfo_rooty() + bbox[1] + bbox[3]
                    self.suggestion_dropdown.show(suggestions, x, y)
            except Exception:
                self.suggestion_dropdown.hide()
        else:
            self.suggestion_dropdown.hide()

    def _on_tab(self, event):
        """Handle Tab key - accept suggestion."""
        if self.suggestion_dropdown.is_visible():
            selected = self.suggestion_dropdown.get_selected()
            if selected:
                self._accept_suggestion(selected)
                return "break"  # Prevent default Tab behavior
        return None

    def _on_return(self, event):
        """Handle Enter key - accept suggestion and newline."""
        if self.suggestion_dropdown.is_visible():
            selected = self.suggestion_dropdown.get_selected()
            if selected:
                self._accept_suggestion(selected)
                self.insert("insert", "\n")
                self.suggestion_dropdown.hide()
                return "break"
        return None

    def _on_up(self, event):
        """Handle Up arrow - navigate suggestions."""
        if self.suggestion_dropdown.is_visible():
            self.suggestion_dropdown.select_previous()
            return "break"
        return None

    def _on_down(self, event):
        """Handle Down arrow - navigate suggestions."""
        if self.suggestion_dropdown.is_visible():
            self.suggestion_dropdown.select_next()
            return "break"
        return None

    def _on_escape(self, event):
        """Handle Escape key - hide suggestions."""
        if self.suggestion_dropdown.is_visible():
            self.suggestion_dropdown.hide()
            return "break"
        return None

    def _accept_suggestion(self, suggestion: str):
        """Accept selected suggestion."""
        # Get current cursor position
        cursor_pos = self.index("insert")

        # Get text before cursor
        content = self.get("1.0", "end-1c")
        lines = content.split("\n")
        current_line_idx = int(cursor_pos.split(".")[0]) - 1
        current_col = int(cursor_pos.split(".")[1])

        if current_line_idx < len(lines):
            current_line = lines[current_line_idx]
            text_before_cursor = current_line[:current_col]

            # Replace last word with suggestion
            words = text_before_cursor.split()
            if words:
                new_line = " ".join(words[:-1]) + " " + suggestion if len(words) > 1 else suggestion

                # Update the line
                lines[current_line_idx] = new_line + current_line[current_col:]
                new_content = "\n".join(lines)

                # Update text widget
                self.delete("1.0", "end-1c")
                self.insert("1.0", new_content)

        self.suggestion_dropdown.hide()
