"""Custom text editor with inline ghost autocomplete + dropdown list."""

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

        # flags
        self._smart_normalize_enabled: bool = True
        self._suppress_keyrelease_once: bool = False
        self._internal_ghost_edit: bool = False

        # regex (normalize on SPACE)
        self._re_space_before_punct = re.compile(r"\s+([\.,])")
        self._re_missing_space_after_punct = re.compile(r"([\.,])(\S)")
        self._re_multi_spaces = re.compile(r" {2,}")
        self._re_cap_after_period = re.compile(r"(\.\s+)([a-zà-ỹđ])", re.UNICODE)
        self._re_first_alpha = re.compile(r"^([^A-Za-zÀ-Ỹà-ỹđĐ]*)([a-zà-ỹđ])", re.UNICODE)

        # inline ghost via tag (most robust, VSCode-like)
        self.tag_config("ghost", foreground="#8A8A8A")

        # dropdown on parent (not clipped)
        self._parent = parent
        self.dropdown_visible = False
        self.dropdown_buttons: list[ctk.CTkButton] = []
        self.dropdown_frame = ctk.CTkFrame(parent, fg_color="#2b2b2b")

        # bindings
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
        """Keep typing native (non-intrusive)."""
        return None

    def _on_key_release(self, event):
        if self._internal_ghost_edit:
            return

        if self._suppress_keyrelease_once:
            self._suppress_keyrelease_once = False
            return

        # Keys that should NOT trigger re-query/hide (keep dropdown stable)
        if event.keysym in [
            "Return", "Left", "Right", "Home", "End",
            "Up", "Down", "Tab", "Escape"
        ]:
            return

        # Re-query on BackSpace/Delete so suggestions update immediately
        if event.keysym in ["BackSpace", "Delete"]:
            self._run_autocomplete_query()
            return

        # normalize + next-word suggestions on SPACE
        if event.keysym == "space":
            self._clear_inline_ghost()
            self._normalize_before_cursor_on_space()
            self._run_next_word_suggestions_after_space()
            return

        # ignore pure modifier key releases
        if event.keysym in ["Shift_L", "Shift_R", "Control_L", "Control_R", "Alt_L", "Alt_R"]:
            return

        # remove stale ghost before processing current key
        self._clear_inline_ghost()
        self._run_autocomplete_query()

    def _normalize_before_cursor_on_space(self):
        """Normalize spacing/capitalization only when user presses SPACE."""
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

        if not before.endswith(" "):
            return

        normalized = before
        normalized = self._re_space_before_punct.sub(r"\1", normalized)
        normalized = self._re_missing_space_after_punct.sub(r"\1 \2", normalized)
        normalized = self._re_multi_spaces.sub(" ", normalized)

        # capitalize first word of current line
        normalized = self._re_first_alpha.sub(lambda m: m.group(1) + m.group(2).upper(), normalized, count=1)
        # capitalize first word after period
        normalized = self._re_cap_after_period.sub(lambda m: m.group(1) + m.group(2).upper(), normalized)

        if normalized != before:
            lines[line_idx] = normalized + after
            new_text = "\n".join(lines)

            self._suppress_keyrelease_once = True
            self.delete("1.0", "end-1c")
            self.insert("1.0", new_text)
            self.mark_set("insert", f"{line_idx + 1}.{len(normalized)}")

    # -----------------------------
    # Query + render
    # -----------------------------
    def _run_next_word_suggestions_after_space(self):
        """After SPACE, show next-word suggestions with empty prefix."""
        content = self.get("1.0", "end-1c")
        cursor_pos = self.index("insert")

        lines = content.split("\n")
        line_idx = int(cursor_pos.split(".")[0]) - 1
        col = int(cursor_pos.split(".")[1])

        if line_idx < len(lines):
            text_before_cursor = lines[line_idx][:col]
        else:
            text_before_cursor = ""

        if not text_before_cursor.endswith(" "):
            self._hide_all()
            return

        context = text_before_cursor.rstrip() + " "
        suggestions = self.suggestion_engine.get_next_word_suggestions(context)

        if suggestions:
            self.suggestions = suggestions[:5]
            self.selected_index = 0
            self._current_prefix = ""
            self._show_ghost_and_dropdown()
        else:
            self._hide_all()

    def _run_autocomplete_query(self):
        content = self.get("1.0", "end-1c")
        cursor_pos = self.index("insert")

        lines = content.split("\n")
        line_idx = int(cursor_pos.split(".")[0]) - 1
        col = int(cursor_pos.split(".")[1])

        text_before_cursor = lines[line_idx][:col] if line_idx < len(lines) else ""

        all_before = "\n".join(lines[:line_idx])
        if all_before:
            all_before += "\n"
        all_before += text_before_cursor

        words = all_before.split()
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
        line_idx = int(cursor_pos.split(".")[0]) - 1
        col = int(cursor_pos.split(".")[1])

        if line_idx >= len(lines):
            self._hide_all()
            return

        line_before = lines[line_idx][:col]

        if line_before.endswith(" "):
            # next-word mode: ghost is full suggestion
            self._ghost_text = suggestion
        else:
            # prefix mode: ghost is the REST after prefix
            words = line_before.split()
            if words:
                prefix = words[-1]
                if suggestion.startswith(prefix):
                    self._ghost_text = suggestion[len(prefix):]
                else:
                    self._ghost_text = suggestion  # no match, show full as ghost
            else:
                self._ghost_text = suggestion

        # If suffix empty, hide ghost but keep dropdown
        if self._ghost_text:
            self._render_inline_ghost()
        else:
            self._clear_inline_ghost()

        self._render_dropdown()

    # -----------------------------
    # Ghost rendering (inline tag)
    # -----------------------------
    def _clear_inline_ghost(self):
        ranges = self.tag_ranges("ghost")
        if ranges:
            self._internal_ghost_edit = True
            try:
                self.delete(ranges[0], ranges[1])
            finally:
                self.tag_remove("ghost", "1.0", "end")
                self._internal_ghost_edit = False

    def _render_inline_ghost(self):
        self._clear_inline_ghost()
        if not self._ghost_text:
            return

        insert_idx = self.index("insert")
        self._internal_ghost_edit = True
        try:
            self.insert(insert_idx, self._ghost_text, ("ghost",))
            self.mark_set("insert", insert_idx)  # caret stays before ghost
        finally:
            self._internal_ghost_edit = False

        self.tag_raise("ghost")
        self.tag_raise("sel")

    # -----------------------------
    # Dropdown
    # -----------------------------
    def _render_dropdown(self):
        try:
            for btn in self.dropdown_buttons:
                btn.destroy()
            self.dropdown_buttons.clear()

            bbox = self.bbox("insert")
            if not bbox:
                self.dropdown_frame.place_forget()
                self.dropdown_visible = False
                return

            # Calculate dropdown position relative to parent window
            parent_x = self.winfo_x()
            parent_y = self.winfo_y()

            max_len = max((len(s) for s in self.suggestions), default=10)
            dropdown_width = max(120, min(420, max_len * 8 + 28))
            dropdown_height = len(self.suggestions) * 28 + 10

            # Position dropdown directly under caret (aligned to caret x position)
            x = parent_x + bbox[0]
            y = parent_y + bbox[1] + bbox[3] + 2

            # Get main window bounds
            try:
                main_win = self
                while main_win.master:
                    main_win = main_win.master
                widget_x = main_win.winfo_x()
                widget_y = main_win.winfo_y()
                widget_width = main_win.winfo_width()
                widget_height = main_win.winfo_height()
                screen_height = main_win.winfo_screenheight()

                # Keep dropdown within widget bounds horizontally
                max_x = widget_x + widget_width - dropdown_width
                x = max(widget_x, min(x, max_x))

                # Prevent dropdown from going below widget bottom
                bottom_y = y + dropdown_height
                if bottom_y > widget_y + widget_height:
                    # Try to show above caret if possible
                    y = parent_y + bbox[1] - dropdown_height - 2
                    if y < widget_y:
                        y = parent_y + bbox[1] + bbox[3] + 2  # fallback to bottom
            except Exception:
                pass

            # Render dropdown buttons
            for i, suggestion in enumerate(self.suggestions):
                btn = ctk.CTkButton(
                    self.dropdown_frame,
                    text=suggestion,
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
        except Exception as e:
            import traceback
            print(f"[ERROR] Dropdown render failed: {e}")
            traceback.print_exc()
            self.dropdown_frame.place_forget()
            self.dropdown_visible = False

    # -----------------------------
    # Accept / hide
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

        # IMPORTANT: remove inline ghost FIRST, then read content/caret
        # so we don't reconstruct text from a snapshot that still contains ghost chars.
        self._clear_inline_ghost()

        cursor_pos = self.index("insert")
        content = self.get("1.0", "end-1c")
        lines = content.split("\n")
        line_idx = int(cursor_pos.split(".")[0]) - 1
        col = int(cursor_pos.split(".")[1])

        if line_idx >= len(lines):
            return

        line = lines[line_idx]
        before = line[:col]
        after = line[col:]

        # Prevent immediate key-release cycle from re-querying mid-mutation
        self._suppress_keyrelease_once = True

        # space-mode: insert next word
        if before.endswith(" ") or self._current_prefix == "":
            new_line = before + suggestion + after
            lines[line_idx] = new_line
            self.delete("1.0", "end-1c")
            self.insert("1.0", "\n".join(lines))
            self.mark_set("insert", f"{line_idx + 1}.{col + len(suggestion)}")
            return

        # prefix-mode: replace only prefix
        words = before.split()
        if words:
            prefix = words[-1]
            start_col = max(0, col - len(prefix))
            new_line = line[:start_col] + suggestion + line[col:]
            lines[line_idx] = new_line
            self.delete("1.0", "end-1c")
            self.insert("1.0", "\n".join(lines))
            self.mark_set("insert", f"{line_idx + 1}.{start_col + len(suggestion)}")
            return

        # fallback
        lines[line_idx] = before + suggestion + after
        self.delete("1.0", "end-1c")
        self.insert("1.0", "\n".join(lines))
        self.mark_set("insert", f"{line_idx + 1}.{col + len(suggestion)}")

    def _hide_all(self):
        self._ghost_text = ""
        self.suggestions = []
        self.selected_index = 0
        self._current_prefix = ""

        self._clear_inline_ghost()

        try:
            self.dropdown_frame.place_forget()
            self.dropdown_visible = False
        except Exception:
            pass

    # -----------------------------
    # navigation
    # -----------------------------
    def _on_tab(self, event):
        if self.suggestions:
            self._accept_suggestion()
            self._hide_all()
            return "break"
        return None

    def _on_up(self, event):
        if self.suggestions:
            # loop navigation: from first -> last
            self.selected_index = (self.selected_index - 1) % len(self.suggestions)
            self._show_ghost_and_dropdown()
            return "break"
        return None

    def _on_down(self, event):
        if self.suggestions:
            # loop navigation: from last -> first
            self.selected_index = (self.selected_index + 1) % len(self.suggestions)
            self._show_ghost_and_dropdown()
            return "break"
        return None

    def _on_escape(self, event):
        if self.suggestions:
            self._hide_all()
            return "break"
        return None
