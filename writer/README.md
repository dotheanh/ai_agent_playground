# Vietnamese Autocomplete Writer

Standalone text editor for Vietnamese writing style autocomplete.

**Status:** Active (Standalone)
**VS Code Extension:** Deprecated (conflict-prone)

---

## Quick Start

```bash
pip install customtkinter
python main.py
```

Import corpus once via **Import Corpus** button. Corpus is persisted in SQLite and auto-loaded next launch.

---

## Main Features

### Autocomplete UX
- **Ghost text (VSCode-like inline tail):** top-1 suggestion rendered inline inside textbox
- **Dropdown top-5:** appears near caret, dynamic width by longest option, no numbering
- **Arrow Up/Down:** move selected suggestion without closing dropdown
- **Tab:** accept selected suggestion
  - If cursor after space: **insert next word**
  - If typing prefix: **replace prefix only**

### Suggestion Logic
- Corpus bigram first
- If corpus < 5 results → fill from Vietnamese dictionary (including compound words)
- Dictionary lookup case-insensitive
- Suggestions clean trailing punctuation (`.,;:!?`)
- **Vietnamese vowel-variant expansion:** if last typed char is a TONELESS lowercase vowel (a, e, i, o, u, y), engine tries all Vietnamese diacritic variants of that vowel for matching
  - Example: typing `đi na` can still suggest `đi nào`, `đi này`
  - Example: typing `tự đo` can suggest `tự động`, `tự đóng`
- **Accented chars do NOT trigger variant expansion:** if last typed char already has diacritic, no expansion occurs
  - Example: typing `tự độ` only matches `tự động` (no `tự đóng` because `ộ` is already accented)
- **Dictionary suggestions shown in italics:** suggestions sourced from dictionary (fallback when corpus has < 5 results) appear in italic font to distinguish them from corpus-based suggestions

### Smart Normalize (Non-intrusive)
- Native typing preserved (no forced punctuation insertion on keypress)
- Normalize only on `Space`:
  - remove extra space before `.` `,`
  - ensure one space after `.` `,`
  - collapse multiple spaces
  - capitalize line-start word and first word after period

### Persistence
- SQLite DB persisted at `data/database.db`
- Corpus auto-loaded on startup
- Dictionary auto-loaded into DB if empty at startup

### Logging
- Import logs in `server.log` include word count, bigram count, top bigrams

---

## Keyboard

| Key | Action |
|---|---|
| Tab | Accept selected suggestion |
| Up / Down | Navigate dropdown |
| Esc | Hide suggestions |
| Space | Trigger normalize + next-word suggestions |

---

## Architecture

```
UI (CustomTkinter)
  ├─ TextEditor (inline ghost + dropdown)
  ├─ Import dialog
  └─ Smart normalize on Space

Core
  ├─ SuggestionEngine (corpus first)
  ├─ Dictionary fallback
  └─ Cache

Data (SQLite)
  ├─ word_frequency
  ├─ bigram_frequency
  ├─ dictionary
  └─ metadata
```

---

## Project Structure

```
writer/
├── main.py
├── src/
│   ├── ui/
│   │   ├── text_editor.py
│   │   ├── dialogs.py
│   │   └── main_window.py
│   ├── core/
│   │   ├── suggestion_engine.py
│   │   ├── corpus_processor.py
│   │   └── cache_manager.py
│   └── data/
│       ├── database.py
│       └── dictionary.py
├── data/
│   ├── database.db
│   └── vietnamese_dict.txt
└── input/
```

---

## Dev

```bash
pytest tests/ -v
```

Reset DB:
```bash
rm data/database.db
```

---

## License

MIT
