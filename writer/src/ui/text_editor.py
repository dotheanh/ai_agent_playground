"""Custom text editor with autocomplete support."""

import customtkinter as ctk
from src.core.suggestion_engine import SuggestionEngine


class TextEditor(ctk.CTkTextbox):
    """Text widget with Vietnamese autocomplete support."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.suggestion_engine = SuggestionEngine()
        self.suggestions: list[str] = []
        self.selected_index: int = 0
        self._show_suggestions: bool = False
        self._current_prefix: str = ""

        # Create suggestion dropdown (popup within main window)
        self.dropdown = ctk.CTkToplevel(self.winfo_toplevel())
        self.dropdown.withdraw()
        self.dropdown.attributes('-topmost', True)
        self.dropdown.configure(fg_color="#1e1e1e")

        self.dropdown_frame = ctk.CTkFrame(self.dropdown, fg_color="#1e1e1e", corner_radius=8)
        self.dropdown_frame.pack()

        self.dropdown_buttons: list[ctk.CTkButton] = []

        # Bind key events
        self.bind("<Tab>", self._on_tab)
        self.bind("<Up>", self._on_up)
        self.bind("<Down>", self._on_down)
        self.bind("<Escape>", self._on_escape)
        self.bind("<KeyRelease>", self._on_key_release)

    def _on_key_release(self, event):
        """Handle key release for autocomplete trigger."""
        # Ignore modifier keys
        if event.state & 0xff0000:  # Control, Alt, Shift
            self._hide_dropdown()
            return

        # Ignore special keys
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
            self._hide_dropdown()
            return

        # Get last word as prefix
        self._current_prefix = words[-1]
        context = " ".join(words[:-1]) + " " if len(words) > 1 else ""

        # Get suggestions
        suggestions = self.suggestion_engine.get_suggestions(context, self._current_prefix)

        if suggestions and len(suggestions) > 0:
            self.suggestions = suggestions[:5]  # Top 5
            self.selected_index = 0
            self._show_suggestions = True
            self._show_dropdown()
        else:
            self._hide_dropdown()

    def _show_dropdown(self):
        """Show suggestion dropdown at cursor position."""
        if not self.suggestions:
            return

        # Clear existing buttons
        for btn in self.dropdown_buttons:
            btn.destroy()
        self.dropdown_buttons.clear()

        # Create buttons for each suggestion
        for i, suggestion in enumerate(self.suggestions):
            btn = ctk.CTkButton(
                self.dropdown_frame,
                text=suggestion,
                width=200,
                height=28,
                fg_color="#2d2d2d" if i != 0 else "#0078d4",
                hover_color="#3a3a3a" if i != 0 else "#006cbd",
                command=lambda idx=i: self._accept_suggestion(idx),
                anchor="w",
                corner_radius=4
            )
            btn.pack(fill="x", padx=2, pady=2)
            self.dropdown_buttons.append(btn)

        # Position dropdown near cursor
        try:
            bbox = self.bbox("insert")
            if bbox:
                x = self.winfo_rootx() + bbox[0]
                y = self.winfo_rooty() + bbox[1] + bbox[3] + 5
                self.dropdown.geometry(f"+{x}+{y}")
                self.dropdown.deiconify()
        except Exception:
            pass

    def _hide_dropdown(self):
        """Hide suggestion dropdown."""
        self._show_suggestions = False
        self.suggestions = []
        self.selected_index = 0
        self._current_prefix = ""
        try:
            self.dropdown.withdraw()
        except Exception:
            pass

    def _accept_suggestion(self, index: int = None):
        """Accept selected suggestion."""
        if index is None:
            index = self.selected_index

        if not self.suggestions or index >= len(self.suggestions):
            return

        suggestion = self.suggestions[index]

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

        self._hide_dropdown()

    def _on_tab(self, event):
        """Handle Tab key - accept suggestion."""
        if self._show_suggestions and self.suggestions:
            self._accept_suggestion(self.selected_index)
            return "break"
        return None

    def _on_return(self, event):
        """Handle Enter key."""
        if self._show_suggestions and self.suggestions:
            self._accept_suggestion(self.selected_index)
        return None

    def _on_up(self, event):
        """Handle Up arrow - navigate suggestions."""
        if self._show_suggestions and self.suggestions:
            self.selected_index = (self.selected_index - 1) % len(self.suggestions)
            self._update_selection()
            return "break"
        return None

    def _on_down(self, event):
        """Handle Down arrow - navigate suggestions."""
        if self._show_suggestions and self.suggestions:
            self.selected_index = (self.selected_index + 1) % len(self.suggestions)
            self._update_selection()
            return "break"
        return None

    def _on_escape(self, event):
        """Handle Escape key - hide suggestions."""
        if self._show_suggestions:
            self._hide_dropdown()
            return "break"
        return None

    def _update_selection(self):
        """Update visual selection in dropdown."""
        for i, btn in enumerate(self.dropdown_buttons):
            if i == self.selected_index:
                btn.configure(fg_color="#0078d4", hover_color="#006cbd")
            else:
                btn.configure(fg_color="#2d2d2d", hover_color="#3a3a3a")
