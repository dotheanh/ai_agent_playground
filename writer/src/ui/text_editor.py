"""Custom text editor with autocomplete support."""

import customtkinter as ctk
from src.core.suggestion_engine import SuggestionEngine


class TextEditor(ctk.CTkTextbox):
    """Text widget with Vietnamese autocomplete support."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.suggestion_engine = SuggestionEngine()
        self.suggestions: list[str] = []
        self.selected_index: int = -1
        self._show_suggestions: bool = False

        # Create suggestion panel (inline, not popup)
        self.suggestion_frame = ctk.CTkFrame(self, fg_color="#3a3a3a", corner_radius=4)
        self.suggestion_label = ctk.CTkLabel(
            self.suggestion_frame,
            text="",
            justify="left",
            anchor="w",
            wraplength=400
        )
        self.suggestion_label.pack(padx=8, pady=6)

        # Bind key events - Tab BEFORE KeyRelease
        self.bind("<Tab>", self._on_tab)
        self.bind("<Up>", self._on_up)
        self.bind("<Down>", self._on_down)
        self.bind("<Escape>", self._on_escape)
        self.bind("<KeyRelease>", self._on_key_release)

    def _on_key_release(self, event):
        """Handle key release for autocomplete trigger."""
        # Ignore modifier keys
        if event.state & 0xff0000:  # Control, Alt, Shift
            self._hide_suggestions()
            return

        # Get current text and cursor position
        content = self.get("1.0", "end-1c")
        cursor_pos = self.index("insert")

        # Get text before cursor on current line
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
            all_text_before += " "
        all_text_before += text_before_cursor

        # Extract context and prefix
        words = all_text_before.split()
        if not words:
            self._hide_suggestions()
            return

        # Simple prefix detection
        last_word = words[-1]
        context = " ".join(words[:-1]) + " " if len(words) > 1 else ""
        prefix = last_word

        # Get suggestions
        suggestions = self.suggestion_engine.get_suggestions(context, prefix)

        if suggestions and len(suggestions) > 0:
            self.suggestions = suggestions
            self.selected_index = 0
            self._show_suggestions = True
            self._update_suggestion_display()
        else:
            self._hide_suggestions()

    def _update_suggestion_display(self):
        """Update the suggestion panel display."""
        if not self._show_suggestions or not self.suggestions:
            self.suggestion_frame.place_forget()
            return

        # Format: highlight prefix, show full suggestion
        current_word = self.suggestions[0]
        display_text = f"Tab: {current_word}"

        self.suggestion_label.configure(text=display_text)

        # Position suggestion panel below cursor
        try:
            bbox = self.bbox("insert")
            if bbox:
                x = 10
                y = bbox[1] + bbox[3] + 5
                self.suggestion_frame.place(x=x, y=y)
        except Exception:
            self.suggestion_frame.place_forget()

    def _hide_suggestions(self):
        """Hide suggestion panel."""
        self._show_suggestions = False
        self.suggestions = []
        self.selected_index = -1
        self.suggestion_frame.place_forget()

    def _accept_suggestion(self):
        """Accept current suggestion."""
        if not self._show_suggestions or not self.suggestions:
            return

        suggestion = self.suggestions[self.selected_index]

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
                remaining = current_line[current_col:]

                # Update the line
                lines[current_line_idx] = new_line + remaining
                new_content = "\n".join(lines)

                # Update text widget
                self.delete("1.0", "end-1c")
                self.insert("1.0", new_content)

        self._hide_suggestions()

    def _on_tab(self, event):
        """Handle Tab key - accept suggestion."""
        if self._show_suggestions and self.suggestions:
            self._accept_suggestion()
            return "break"
        return None

    def _on_return(self, event):
        """Handle Enter key."""
        # If suggestions shown, accept and let newline happen
        if self._show_suggestions and self.suggestions:
            self._accept_suggestion()
        return None

    def _on_up(self, event):
        """Handle Up arrow - navigate suggestions."""
        if self._show_suggestions and self.suggestions:
            self.selected_index = (self.selected_index - 1) % len(self.suggestions)
            self._update_suggestion_display()
            return "break"
        return None

    def _on_down(self, event):
        """Handle Down arrow - navigate suggestions."""
        if self._show_suggestions and self.suggestions:
            self.selected_index = (self.selected_index + 1) % len(self.suggestions)
            self._update_suggestion_display()
            return "break"
        return None

    def _on_escape(self, event):
        """Handle Escape key - hide suggestions."""
        if self._show_suggestions:
            self._hide_suggestions()
            return "break"
        return None
