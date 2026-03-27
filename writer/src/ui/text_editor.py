"""Custom text editor with ghost autocomplete + dropdown list."""

import re
import customtkinter as ctk
from src.core.suggestion_engine import SuggestionEngine


class TextEditor(ctk.CTkTextbox):
    """Text widget with Vietnamese autocomplete (ghost + dropdown)."""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.suggestion_engine = SuggestionEngine()
        self.suggestions: list[str] = []
        self.selected_index: int = 0
        self._current_prefix: str = ""
        self._ghost_text: str = ""

        # Smart normalize policy: only run when user presses SPACE
        self._smart_normalize_enabled: bool = True
        self._suppress_keyrelease_once: bool = False

        # Regex for smart normalize
        self._re_space_before_punct = re.compile(r"\s+([\.,])")
        self._re_missing_space_after_punct = re.compile(r"([\.,])(\S)")
        self._re_multi_spaces = re.compile(r" {2,}")
        self._re_cap_after_period = re.compile(r"(\.\s+)([a-zà-ỹđ])", re.UNICODE)
        self._re_first_alpha = re.compile(r"^([^A-Za-zÀ-Ỹà-ỹđĐ]*)([a-zà-ỹđ])", re.UNICODE)

        # Ghost label: child of textbox for stable local positioning
        self.ghost_label = ctk.CTkLabel(self, text="", text_color="#A8A8A8", font=("Consolas", 14))

        # Dropdown frame: child of parent so it can escape textbox clipping
        self.dropdown_visible = False
        self.dropdown_buttons: list[ctk.CTkButton] = []
        self.dropdown_frame = ctk.CTkFrame(parent, fg_color="#2b2b2b")

        # Bindings
        self.bind("<Key>", self._on_key_press)
        self.bind("<KeyRelease>", self._on_key_release)
        self.bind("<Tab>", self._on_tab)
        self.bind("<Up>", self._on_up)
        self.bind("<Down>", self._on_down)
        self.bind("<Escape>", self._on_escape)

    # -----------------------------
    # Input handling
    # -----------------------------
    def _on_key_press(self, event):
        """Keep typing behavior native. No forced '.'/',' insertion."""
        return None

    def _on_key_release(self, event):
        """Trigger normalize on SPACE; trigger autocomplete on normal chars."""
        if self._suppress_keyrelease_once:
            self._suppress_keyrelease_once = False
            return

        # Normalize only when user explicitly presses SPACE
        if event.keysym == "space":
            self._normalize_before_cursor_on_space()
            self._hide_all()
            return

        # Ignore modifier/special keys for autocomplete query
        if event.state & 0xff0000:
            self._hide_all()
            return

        if event.keysym in [
            "Return", "BackSpace", "Delete", "Left", "Right", "Home", "End",
            "Up", "Down", "Tab", "Escape", "period", "comma"
        ]:
            return

        self._run_autocomplete_query()

    def _normalize_before_cursor_on_space(self):
        """After user presses SPACE, normalize spacing/caps before cursor only."""
        if not self._smart_normalize_enabled:
            return

        cursor_pos = self.index("insert")
        line_idx = int(cursor_pos.split(".")[0]) - 1
        col = int(cursor_pos.split(".")[1])

        content = self.get("1.0", "end-1c")
        lines = content.split("\n")
        if line_idx >= len(lines):
            return

        line = lines[line_idx]
        before = line[:col]
        after = line[col:]

        # Must end with space (user just typed space)
        if not before.endswith(" "):
            return

        normalized = before

        # 1) remove spaces before punctuation
        normalized = self._re_space_before_punct.sub(r"\1", normalized)

        # 2) ensure single space after punctuation if missing
        normalized = self._re_missing_space_after_punct.sub(r"\1 \2", normalized)

        # 3) collapse multiple spaces
        normalized = self._re_multi_spaces.sub(" ", normalized)

        # 4) capitalize first word at start of current line
        normalized = self._re_first_alpha.sub(lambda m: m.group(1) + m.group(2).upper(), normalized, count=1)

        # 5) capitalize first word after period on current line
        normalized = self._re_cap_after_period.sub(lambda m: m.group(1) + m.group(2).upper(), normalized)

        if normalized != before:
            lines[line_idx] = normalized + after
            new_text = "\n".join(lines)

            self._suppress_keyrelease_once = True
            self.delete("1.0", "end-1c")
            self.insert("1.0", new_text)

            new_col = len(normalized)
            self.mark_set("insert", f"{line_idx + 1}.{new_col}")

    # -----------------------------
    # Autocomplete query + render
    # -----------------------------
    def _run_autocomplete_query(self):
        content = self.get("1.0", "end-1c")
        cursor_pos = self.index("insert")

        lines = content.split("\n")
        current_line_idx = int(cursor_pos.split(".")[0]) - 1
        current_col = int(cursor_pos.split(".")[1])

        if current_line_idx < len(lines):
            text_before_cursor = lines[current_line_idx][:current_col]
        else:
            text_before_cursor = ""

        all_text_before = "\n".join(lines[:current_line_idx])
        if all_text_before:
            all_text_before += "\n"
        all_text_before += text_before_cursor

        words = all_text_before.split()
        if not words:
            self._hide_all()
            return

        self._current_prefix = words[-1]
        context = " ".join(words[:-1]) + " " if len(words) > 1 else ""

        suggestions = self.suggestion_engine.get_suggestions(context, self._current_prefix)

        if suggestions:
            self.suggestions = suggestions[:5]
            self.selected_index = 0
            self._show_ghost_and_dropdown()
        else:
            self._hide_all()

    def _show_ghost_and_dropdown(self):
        if not self.suggestions:
            return

        suggestion = self.suggestions[self.selected_index]

        cursor_pos = self.index("insert")
        content = self.get("1.0", "end-1c")
        lines = content.split("\n")
        current_line_idx = int(cursor_pos.split(".")[0]) - 1
        current_col = int(cursor_pos.split(".")[1])

        if current_line_idx >= len(lines):
            self._hide_all()
            return

        current_line = lines[current_line_idx]
        text_before_cursor = current_line[:current_col]
        words = text_before_cursor.split()

        if words:
            prefix = words[-1]
            self._ghost_text = suggestion[len(prefix):] if suggestion.startswith(prefix) else suggestion
        else:
            self._ghost_text = suggestion

        self._render_ghost()
        self._render_dropdown()

    def _render_ghost(self):
        if not self._ghost_text:
            self.ghost_label.place_forget()
            return

        try:
            bbox = self.bbox("insert")
            if not bbox:
                self.ghost_label.place_forget()
                return

            # label is child of textbox => local coordinates
            x = bbox[0] + bbox[2]
            y = bbox[1]
            self.ghost_label.configure(text=self._ghost_text)
            self.ghost_label.place(x=x, y=y)
            self.ghost_label.lift()
        except Exception:
            self.ghost_label.place_forget()

    def _render_dropdown(self):
        try:
            for btn in self.dropdown_buttons:
                btn.destroy()
            self.dropdown_buttons.clear()

            bbox = self.bbox("insert")
            if not bbox:
                self.dropdown_frame.place_forget()
                return

            # dropdown_frame is child of parent window => convert from textbox-local to parent-local
            x = self.winfo_x() + bbox[0]
            y = self.winfo_y() + bbox[1] + bbox[3] + 4

            max_len = max((len(s) for s in self.suggestions), default=10)
            dropdown_width = max(120, min(420, max_len * 8 + 28))

            for i, suggestion in enumerate(self.suggestions):
                btn = ctk.CTkButton(
                    self.dropdown_frame,
                    text=suggestion,  # no numbering
                    width=dropdown_width,
                    height=28,
                    fg_color="#2b2b2b" if i != self.selected_index else "#0078d4",
                    hover_color="#3a3a3a",
                    command=lambda idx=i: self._select_from_dropdown(idx),
                    anchor="w"
                )
                btn.pack(fill="x", padx=2, pady=1)
                self.dropdown_buttons.append(btn)

            self.dropdown_frame.place(x=x, y=y)
            self.dropdown_frame.lift()
            self.dropdown_visible = True
        except Exception:
            self.dropdown_frame.place_forget()
            self.dropdown_visible = False

    # -----------------------------
    # Suggestion actions
    # -----------------------------
    def _select_from_dropdown(self, index: int):
        if 0 <= index < len(self.suggestions):
            self.selected_index = index
            self._accept_suggestion()
            self._hide_all()

    def _accept_suggestion(self):
        if not self.suggestions:
            return

        suggestion = self.suggestions[self.selected_index]

        cursor_pos = self.index("insert")
        content = self.get("1.0", "end-1c")
        lines = content.split("\n")
        current_line_idx = int(cursor_pos.split(".")[0]) - 1
        current_col = int(cursor_pos.split(".")[1])

        if current_line_idx >= len(lines):
            return

        current_line = lines[current_line_idx]
        text_before_cursor = current_line[:current_col]
        words = text_before_cursor.split()

        if words:
            new_line = " ".join(words[:-1]) + " " + suggestion if len(words) > 1 else suggestion
            remaining = current_line[current_col:]
            lines[current_line_idx] = new_line + remaining
            new_content = "\n".join(lines)

            self.delete("1.0", "end-1c")
            self.insert("1.0", new_content)

    def _hide_all(self):
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

    # -----------------------------
    # Navigation keys
    # -----------------------------
    def _on_tab(self, event):
        if self.suggestions:
            self._accept_suggestion()
            self._hide_all()
            return "break"
        return None

    def _on_up(self, event):
        if self.suggestions:
            self.selected_index = max(0, self.selected_index - 1)
            self._show_ghost_and_dropdown()
            return "break"
        return None

    def _on_down(self, event):
        if self.suggestions:
            self.selected_index = min(len(self.suggestions) - 1, self.selected_index + 1)
            self._show_ghost_and_dropdown()
            return "break"
        return None

    def _on_escape(self, event):
        if self.suggestions:
            self._hide_all()
            return "break"
        return None
