# Vietnamese Autocomplete Writer

A lightweight standalone text editor that provides real-time Vietnamese autocomplete suggestions based on your personal writing style.

**No VS Code conflicts. No external dependencies. Just works.**

---

## ⚠️ VS Code Extension DEPRECATED

The VS Code Extension version has been deprecated due to conflicts with VS Code's built-in autocomplete system. Please use the **Standalone App** below.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements-server.txt
pip install -r requirements.txt
```

### 2. Run the App

```bash
python main.py
```

That's it! The app will:
- Open a text editor window
- Connect to the built-in suggestion engine
- Ready for you to start writing

### 3. Import Your Corpus

Click **"Import Corpus"** button → Select a folder with `.txt` files (your old writings, diaries, etc.)

---

## ✨ Features

- **Real-time Ghost Text** - See the best suggestion highlighted as you type
- **Dropdown List** - Shows top 5 suggestions
- **Frequency-based** - Learns from your writing style
- **Dictionary Fallback** - Works even without corpus
- **Vietnamese Support** - Built-in Vietnamese dictionary

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Accept suggestion |
| `Up/Down` | Navigate suggestions |
| `Enter` | Accept + newline |
| `Escape` | Dismiss |

---

## 📁 Project Structure

```
writer/
├── main.py                    # Standalone app entry point
├── server.py                 # FastAPI backend (built-in)
├── requirements.txt           # App dependencies
├── requirements-server.txt   # Backend dependencies
├── src/
│   ├── ui/                   # UI components
│   │   ├── text_editor.py    # Text editor with ghost text
│   │   └── suggestion_dropdown.py # Dropdown list
│   ├── core/                 # Core logic
│   │   ├── suggestion_engine.py  # Suggestion algorithm
│   │   ├── corpus_processor.py  # Text processing
│   │   └── cache_manager.py      # Caching
│   └── data/                 # Data layer
│       ├── database.py         # SQLite
│       └── dictionary.py        # Vietnamese dictionary
├── data/
│   ├── database.db           # User corpus database
│   └── vietnamese_dict.txt   # Dictionary
└── input/                   # Place corpus .txt files here
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Vietnamese Autocomplete Writer                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CustomTkinter UI                                 │   │
│  │  - Text Editor with Ghost Text                   │   │
│  │  - Suggestion Dropdown                           │   │
│  │  - Import Corpus Dialog                          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Suggestion Engine (Same Process)               │   │
│  │  - BigRAM Frequency                             │   │
│  │  - Dictionary Fallback                           │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SQLite Database                                 │   │
│  │  - word_frequency                                │   │
│  │  - bigram_frequency                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Development

### Run App
```bash
python main.py
```

### Run Tests
```bash
pytest tests/ -v
```

### Backend API (Optional)
If you want to use the FastAPI server separately:
```bash
python server.py
```

Test API:
```powershell
# PowerShell
$body = @{ context = "tôi "; prefix = "tôi" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/suggest" -Method Post -Body $body
```

---

## 📋 Requirements

- Python 3.10+
- customtkinter
- SQLite (built-in)

---

## License

MIT
