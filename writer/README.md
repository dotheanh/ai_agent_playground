# Vietnamese Autocomplete Writer

A lightweight standalone text editor that provides real-time Vietnamese autocomplete suggestions based on your personal writing style.

**No VS Code conflicts. No external dependencies. Just works.**

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install customtkinter
```

### 2. Run the App

```bash
python main.py
```

### 3. Import Your Corpus

Click **"Import Corpus"** button → Select a folder with `.txt` files (your old writings, diaries, etc.)

**Done!** The app will remember your corpus next time you open it.

---

## ✨ Features

### Autocomplete
- **Ghost Text** - See the best suggestion highlighted as you type
- **Dropdown List** - Shows top 5 suggestions (numbered 1-5)
- **Frequency-based** - Learns from your writing style
- **Dictionary Fallback** - Works even without corpus

### Smart Typing
- **Auto space after punctuation** - Type `.` or `,` automatically adds space
- **Auto capitalize** - After `.` or Enter, next word is auto-capitalized
- **Vietnamese support** - Built-in Vietnamese dictionary

### Case-Sensitive
- **Preserves your writing style** - "Tôi" and "tôi" are treated as different words
- **Exact matches** - Suggestions match your original capitalization

### Persistent Storage
- **Auto-load corpus** - No need to re-import on restart
- **SQLite database** - Fast and reliable

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Accept suggestion |
| `Up/Down` | Navigate suggestions |
| `Enter` | Accept + newline + auto-capitalize |
| `Esc` | Dismiss suggestions |

### Smart Typing
| Key | Action |
|-----|--------|
| `.` | Auto-add `. ` + capitalize next word |
| `,` | Auto-add `, ` |
| `Enter` | Auto-capitalize first letter |

---

## 📁 Project Structure

```
writer/
├── main.py                    # Standalone app entry point
├── requirements.txt           # App dependencies
├── src/
│   ├── ui/                   # UI components
│   │   ├── text_editor.py    # Text editor with ghost text
│   │   ├── suggestion_dropdown.py # Dropdown list
│   │   └── dialogs.py        # Import corpus dialog
│   ├── core/                 # Core logic
│   │   ├── suggestion_engine.py  # Suggestion algorithm
│   │   ├── corpus_processor.py  # Text processing
│   │   └── cache_manager.py      # Caching
│   └── data/                 # Data layer
│       ├── database.py         # SQLite
│       └── dictionary.py        # Vietnamese dictionary
├── data/
│   ├── database.db           # User corpus database (auto-created)
│   └── vietnamese_dict.txt     # Dictionary
└── input/                    # Place corpus .txt files here
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Vietnamese Autocomplete Writer                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CustomTkinter UI                                 │   │
│  │  - Text Editor with Ghost Text                   │   │
│  │  - Dropdown List (5 suggestions)                │   │
│  │  - Smart Typing (auto space, capitalize)        │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Suggestion Engine (Same Process)                 │   │
│  │  - BigRAM Frequency                             │   │
│  │  - Dictionary Fallback                           │   │
│  │  - Case-Sensitive Matching                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SQLite Database                                 │   │
│  │  - word_frequency                               │   │
│  │  - bigram_frequency                             │   │
│  │  - dictionary                                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Development

### Run Tests
```bash
pytest tests/ -v
```

### Database Location
Database is stored at `data/database.db` and persists between sessions.

### Clear Database
To reset and start fresh:
```bash
rm data/database.db
```

---

## 📋 Requirements

- Python 3.10+
- customtkinter
- SQLite (built-in)

---

## License

MIT
