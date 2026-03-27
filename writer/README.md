# Vietnamese Autocomplete Writer

VS Code extension that provides real-time Vietnamese autocomplete suggestions based on your personal writing style, powered by a FastAPI backend.

## ⚠️ DEPRECATED: Standalone App

The standalone app version (CustomTkinter UI) has been deprecated. Please use the **VS Code Extension** version below.

---

## Features

- Import personal text corpus (.txt files)
- Real-time Vietnamese autocomplete with ghost text
- Frequency-based suggestions from your writing style
- Dictionary fallback for unknown words
- Works in any text file in VS Code

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              VS Code Extension (TypeScript)               │
│  - Ghost text inline completions                          │
│  - VS Code commands                                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI Backend                       │
│  - Suggestion engine (bigram frequency)                  │
│  - Corpus processor                                       │
│  - SQLite database                                        │
└─────────────────────────────────────────────────────────┘
```

## Installation

### 1. Install VS Code Extension

```bash
cd extension
vsce package
code --install-extension vietnamese-autocomplete-0.1.0.vsix
```

### 2. Install Backend Dependencies

```bash
pip install -r requirements-server.txt
```

## Usage

### 1. Start Backend Server

```bash
python server.py
```

Server will start on `http://127.0.0.1:8000`

### 2. Open VS Code

The extension will automatically activate and connect to the backend.

### 3. Import Corpus

Press `Ctrl+Shift+P` and run:
```
Vietnamese Autocomplete: Import Corpus
```

Select a folder containing `.txt` files.

### 4. Start Writing

Type Vietnamese text - ghost text suggestions will appear automatically.

## VS Code Commands

| Command | Description |
|---------|-------------|
| `Vietnamese Autocomplete: Import Corpus` | Import corpus from folder |
| `Vietnamese Autocomplete: Open Settings` | Open extension settings |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `vietnameseAutocomplete.pythonServerUrl` | `http://127.0.0.1:8000` | Backend URL |

## Keyboard Shortcuts

- **Tab**: Accept suggestion
- **Up/Down**: Navigate suggestions (when ghost text shown)

## Project Structure

```
writer/
├── server.py                     # FastAPI backend
├── requirements-server.txt       # Backend dependencies
├── extension/                    # VS Code Extension
│   ├── package.json             # Extension manifest
│   ├── src/
│   │   ├── extension.ts         # Entry point
│   │   ├── inline-completions.ts # Inline completions
│   │   └── python-server.ts    # Server manager
│   └── out/                     # Compiled JS
├── src/                         # Shared Python code
│   ├── core/                    # Suggestion engine
│   └── data/                    # Database layer
└── data/
    ├── database.db               # SQLite database
    └── vietnamese_dict.txt      # Dictionary
```

## Development

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
vsce package
```

## License

MIT
