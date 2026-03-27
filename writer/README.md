# Vietnamese Autocomplete Writer

VS Code extension provides real-time Vietnamese autocomplete suggestions based on your personal writing style, powered by a FastAPI backend.

## ⚠️ IMPORTANT: VS Code Auto-Complete Conflicts

**Before installing, you must disable VS Code's built-in autocomplete to avoid conflicts:**

### Settings to Disable (REQUIRED)

1. Open VS Code Settings (`Ctrl+,`)
2. Search and disable these settings:

| Setting | Value | Why |
|---------|-------|-----|
| `editor.quickSuggestions` | `false` | Conflicts with our ghost text |
| `editor.wordBasedSuggestions` | `off` | Conflicts with word suggestions |
| `editor.inlineSuggest.enabled` | `false` | Conflicts with inline suggestions |

### Or Use Extension's Auto-Disable

When extension activates, it will prompt:
```
"Vietnamese Autocomplete: Disable conflicting VS Code suggestions?"
```

Click **"Disable Conflicts"** to auto-configure.

---

## 📦 Installation

### Step 1: Install Backend Dependencies

```bash
cd writer
pip install -r requirements-server.txt
```

### Step 2: Package & Install Extension

```bash
cd extension
npm install
npm run compile
npx vsce package
code --install-extension vietnamese-autocomplete-0.1.0.vsix
```

### Step 3: Reload VS Code

Press `Ctrl+Shift+P` → `Developer: Reload Window`

---

## 🚀 Startup

### Step 1: Start Python Backend Server

```bash
cd writer
python server.py
```

Server runs at: `http://127.0.0.1:8000`

### Step 2: Open VS Code

Extension will auto-activate and connect to backend.

### Step 3: Import Your Corpus

Press `Ctrl+Shift+P`, then:
```
Vietnamese Autocomplete: Import Corpus
```
Select a folder containing `.txt` files (your old writings, diaries, etc.)

### Step 4: Start Writing!

Open any `.txt` or `.md` file and type Vietnamese text.

---

## 🔧 VS Code Commands

| Command | Description |
|---------|-------------|
| `Vietnamese Autocomplete: Import Corpus` | Import corpus from folder |
| `Vietnamese Autocomplete: Open Settings` | Open extension settings |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Accept ghost text suggestion |
| `Escape` | Dismiss suggestion |

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `vietnameseAutocomplete.pythonServerUrl` | `http://127.0.0.1:8000` | Backend server URL |

---

## 🔍 Troubleshooting

### "Extension not showing commands"

1. Uninstall old extension
2. Reload VS Code (`Ctrl+Shift+P` → `Developer: Reload Window`)
3. Reinstall extension

### "Suggestions not appearing"

1. Make sure `python server.py` is running
2. Check server is running at `http://127.0.0.1:8000`
3. Verify corpus is imported (check status bar)

### "VS Code suggestions conflict with extension"

Disable these in VS Code Settings:
- `editor.quickSuggestions` → `false`
- `editor.wordBasedSuggestions` → `off`
- `editor.inlineSuggest.enabled` → `false`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              VS Code Extension (TypeScript)               │
│  - Ghost text inline completions                         │
│  - Auto-disable conflicting settings                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP POST /api/suggest
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI Backend                       │
│  Port: 127.0.0.1:8000                                   │
│  - /api/suggest - Get suggestions                       │
│  - /api/import - Import corpus                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
writer/
├── server.py                    # FastAPI backend
├── requirements-server.txt     # Python dependencies
├── extension/                  # VS Code Extension
│   ├── package.json           # Extension manifest
│   └── src/
│       ├── extension.ts        # Entry point + commands
│       ├── inline-completions.ts # Ghost text provider
│       └── python-server.ts   # Backend manager
├── src/                       # Shared Python code
│   ├── core/                  # Suggestion engine
│   └── data/                  # SQLite database
└── data/
    └── database.db            # User corpus data
```

---

## 🔨 Development

### Run Backend
```bash
python server.py
```

### Test API
```bash
curl http://127.0.0.1:8000/health
```

### Compile Extension
```bash
cd extension
npm install
npm run compile
```

### Package Extension
```bash
cd extension
npx vsce package
```

---

## 📋 Requirements

### Python
- Python 3.10+
- fastapi
- uvicorn
- pydantic

### VS Code
- VS Code 1.85+

---

## License

MIT
