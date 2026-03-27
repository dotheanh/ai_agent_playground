"""Custom text editor with inline autocomplete ghost text and dropdown list."""

import customtkinter as ctk
from src.core.suggestion_engine import SuggestionEngine


class TextEditor(ctk.CTkTextbox):
    """Text widget with Vietnamese autocomplete - ghost text + dropdown."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.suggestion_engine = SuggestionEngine()
        self.suggestions: list[str] = []
        self.selected_index: int = 0
        self._current_prefix: str = ""
        self._ghost_text: str = ""

        # Create ghost text label on parent window
        self.ghost_label = ctk.CTkLabel(parent, text="", text_color="#888888", font=("Consolas", 14))
        print("[DEBUG] Ghost label created")

        # Create dropdown list
        self.dropdown_visible = False
        self.dropdown_buttons: list[ctk.CTkButton] = []
        self.dropdown_frame = ctk.CTkFrame(parent, fg_color="#2b2b2b")
        print("[DEBUG] Dropdown frame created")

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
            self._hide_all()
            return

        # Handle space key - clear ghost but still allow suggestions
        if event.keysym == 'space':
            self._hide_all()
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
            self._hide_all()
            return

        # Get last word as prefix
        self._current_prefix = words[-1]
        context = " ".join(words[:-1]) + " " if len(words) > 1 else ""

        print(f"[DEBUG] Getting suggestions for context='{context}', prefix='{self._current_prefix}'")

        # Get suggestions
        suggestions = self.suggestion_engine.get_suggestions(context, self._current_prefix)
        print(f"[DEBUG] Got {len(suggestions)} suggestions: {suggestions[:3]}...")

        if suggestions and len(suggestions) > 0:
            self.suggestions = suggestions[:5]
            self.selected_index = 0
            self._show_ghost_and_dropdown()
        else:
            print("[DEBUG] No suggestions, hiding all")
            self._hide_all()

    def _show_ghost_and_dropdown(self):
        """Show both ghost text and dropdown list."""
        if not self.suggestions:
            return

        # Get the best suggestion
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

            # Calculate ghost text
            words = text_before_cursor.split()
            if words:
                prefix = words[-1]
                if suggestion.startswith(prefix):
                    self._ghost_text = suggestion[len(prefix):]
                else:
                    self._ghost_text = suggestion
            else:
                self._ghost_text = suggestion

            # Render ghost text
            self._render_ghost()

            # Render dropdown
            self._render_dropdown()

    def _render_ghost(self):
        """Render ghost text overlay at cursor position."""
        if not self._ghost_text:
            self.ghost_label.place_forget()
            return

        try:
            bbox = self.bbox("insert")
            if bbox:
                x = self.winfo_rootx() + bbox[0] + bbox[2]
                y = self.winfo_rooty() + bbox[1]
                self.ghost_label.configure(text=self._ghost_text)
                self.ghost_label.place(x=x, y=y)
                self.ghost_label.lift()
                print(f"[DEBUG] Ghost rendered: '{self._ghost_text}'")
        except Exception as e:
            print(f"[DEBUG] Ghost render error: {e}")

    def _render_dropdown(self):
        """Render dropdown list with 5 suggestions."""
        try:
            # Clear existing buttons
            for btn in self.dropdown_buttons:
                btn.destroy()
            self.dropdown_buttons.clear()

            # Get cursor position for dropdown
            bbox = self.bbox("insert")
            if not bbox:
                return

            x = self.winfo_rootx() + bbox[0]
            y = self.winfo_rooty() + bbox[1] + bbox[3] + 5  # Below cursor

            # Create buttons for each suggestion
            for i, suggestion in enumerate(self.suggestions):
                btn = ctk.CTkButton(
                    self.dropdown_frame,
                    text=f"{i+1}. {suggestion}",
                    width=200,
                    height=28,
                    fg_color="#2b2b2b" if i != self.selected_index else "#0078d4",
                    hover_color="#3a3a3a",
                    command=lambda idx=i: self._select_from_dropdown(idx),
                    anchor="w"
                )
                btn.pack(fill="x", padx=2, pady=1)
                self.dropdown_buttons.append(btn)

            # Position and show dropdown
            self.dropdown_frame.place(x=x, y=y)
            self.dropdown_frame.lift()
            self.dropdown_visible = True
            print(f"[DEBUG] Dropdown rendered with {len(self.suggestions)} items")

        except Exception as e:
            print(f"[DEBUG] Dropdown render error: {e}")

    def _select_from_dropdown(self, index: int):
        """Select suggestion from dropdown."""
        if 0 <= index < len(self.suggestions):
            self.selected_index = index
            self._accept_suggestion()
            self._hide_all()

    def _hide_all(self):
        """Hide ghost text and dropdown."""
        self._ghost_text = ""
        self.suggestions = []
        self.selected_index = 0
        self._current_prefix = ""

        try:
            self.ghost_label.place_forget()
        except Exception:
            pass

        try:
            self.dropdown_frame.place_forget()
            self.dropdown_visible = False
        except Exception:
            pass

    def _accept_suggestion(self):
        """Accept current suggestion."""
        if not self.suggestions:
            return

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

            # Replace last word with suggestion
            words = text_before_cursor.split()
            if words:
                new_line = " ".join(words[:-1]) + " " + suggestion if len(words) > 1 else suggestion
                remaining = current_line[current_col:]
                lines[current_line_idx] = new_line + remaining
                new_content = "\n".join(lines)

                # Update text widget
                self.delete("1.0", "end-1c")
                self.insert("1.0", new_content)

                print(f"[DEBUG] Accepted suggestion: '{suggestion}'")

    def _on_tab(self, event):
        """Handle Tab key - accept suggestion."""
        if self.suggestions:
            self._accept_suggestion()
            self._hide_all()
            return "break"
        return None

    def _on_up(self, event):
        """Handle Up arrow - navigate suggestions."""
        if self.suggestions:
            self.selected_index = max(0, self.selected_index - 1)
            self._show_ghost_and_dropdown()
            return "break"
        return None

    def _on_down(self, event):
        """Handle Down arrow - navigate suggestions."""
        if self.suggestions:
            self.selected_index = min(len(self.suggestions) - 1, self.selected_index + 1)
            self._show_ghost_and_dropdown()
            return "break"
        return None

    def _on_escape(self, event):
        """Handle Escape key - clear suggestions."""
        if self.suggestions:
            self._hide_all()
            return "break"
        return None
