"""Custom text editor with inline autocomplete ghost text."""

import customtkinter as ctk
from src.core.suggestion_engine import SuggestionEngine


class TextEditor(ctk.CTkTextbox):
    """Text widget with Vietnamese autocomplete - inline ghost text style."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.suggestion_engine = SuggestionEngine()
        self.suggestions: list[str] = []
        self.selected_index: int = 0
        self._current_prefix: str = ""
        self._ghost_text: str = ""
        self._ghost_label_created: bool = False

        # Bind key events
        self.bind("<Tab>", self._on_tab)
        self.bind("<Up>", self._on_up)
        self.bind("<Down>", self._on_down)
        self.bind("<Escape>", self._on_escape)
        self.bind("<KeyRelease>", self._on_key_release)
        self.bind("<Map>", self._on_map)  # When widget is mapped (shown)

    def _on_key_release(self, event):
        """Handle key release for autocomplete trigger."""
        # Ignore modifier keys
        if event.state & 0xff0000:  # Control, Alt, Shift
            self._clear_ghost()
            return

        # Handle space key - clear ghost but still allow suggestions
        if event.keysym == 'space':
            self._clear_ghost()
            return

        # Ignore special keys that don't trigger autocomplete
        if event.keysym in ['Return', 'BackSpace', 'Delete', 'Left', 'Right', 'Home', 'End']:
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
            self._clear_ghost()
            return

        # Get last word as prefix
        self._current_prefix = words[-1]
        context = " ".join(words[:-1]) + " " if len(words) > 1 else ""

        # Get suggestions
        suggestions = self.suggestion_engine.get_suggestions(context, self._current_prefix)

        if suggestions and len(suggestions) > 0:
            self.suggestions = suggestions[:5]
            self.selected_index = 0
            self._update_ghost_text()
        else:
            self._clear_ghost()

    def _update_ghost_text(self):
        """Update ghost text preview."""
        if not self.suggestions:
            self._clear_ghost()
            return

        # Get the best suggestion (auto-select first)
        suggestion = self.suggestions[self.selected_index]

        # Get current cursor position
        cursor_pos = self.index("insert")
        content = self.get("1.0", "end-1c")
        lines = content.split("\n")
        current_line_idx = int(cursor_pos.split(".")[0]) - 1
        current_col = int(cursor_pos.split(".")[1])

        if current_line_idx < len(lines):
            current_line = lines[current_line_idx]
            text_before_cursor = current_line[:current_col]

            # Calculate ghost text (the part after what's already typed)
            words = text_before_cursor.split()
            if words:
                prefix = words[-1]
                # Ghost is the rest of the suggestion after the prefix
                if suggestion.startswith(prefix):
                    self._ghost_text = suggestion[len(prefix):]
                else:
                    self._ghost_text = suggestion
            else:
                self._ghost_text = suggestion

            # Render ghost text at cursor position
            self._render_ghost()

    def _on_map(self, event):
        """Called when widget is mapped (shown). Create ghost label here."""
        if not self._ghost_label_created:
            # Create ghost text overlay label on main window
            try:
                main_window = self.winfo_toplevel()
                self.ghost_label = ctk.CTkLabel(main_window, text="", text_color="#6b6b6b", font=("Consolas", 14))
                self._ghost_label_created = True
            except Exception:
                pass

    def _render_ghost(self):
        """Render ghost text overlay at cursor position."""
        if not self._ghost_text or not hasattr(self, 'ghost_label'):
            return

        try:
            # Get cursor bbox
            bbox = self.bbox("insert")
            if bbox:
                # Position ghost label right after cursor
                x = self.winfo_rootx() + bbox[0] + bbox[2]
                y = self.winfo_rooty() + bbox[1]
                self.ghost_label.configure(text=self._ghost_text)
                self.ghost_label.place(x=x, y=y)
                self.ghost_label.lift()  # Bring to front
        except Exception:
            pass

    def _clear_ghost(self):
        """Clear ghost text and suggestions."""
        self._ghost_text = ""
        self.suggestions = []
        self.selected_index = 0
        self._current_prefix = ""
        try:
            if hasattr(self, 'ghost_label'):
                self.ghost_label.place_forget()
        except Exception:
            pass

    def _accept_suggestion(self):
        """Accept current suggestion."""
        if not self.suggestions:
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

        self._clear_ghost()

    def _on_tab(self, event):
        """Handle Tab key - accept suggestion."""
        if self.suggestions:
            self._accept_suggestion()
            return "break"
        return None

    def _on_return(self, event):
        """Handle Enter key."""
        if self.suggestions:
            self._accept_suggestion()
        return None

    def _on_up(self, event):
        """Handle Up arrow - navigate suggestions."""
        if self.suggestions:
            self.selected_index = (self.selected_index - 1) % len(self.suggestions)
            self._update_ghost_text()
            return "break"
        return None

    def _on_down(self, event):
        """Handle Down arrow - navigate suggestions."""
        if self.suggestions:
            self.selected_index = (self.selected_index + 1) % len(self.suggestions)
            self._update_ghost_text()
            return "break"
        return None

    def _on_escape(self, event):
        """Handle Escape key - clear suggestions."""
        if self.suggestions:
            self._clear_ghost()
            return "break"
        return None
