# Vietnamese Autocomplete - VS Code Extension Design Specification

**Date:** 2026-03-27
**Project:** Vietnamese Autocomplete Writer
**Tech Stack:** FastAPI (Python Backend) + VS Code Extension (TypeScript)
**Status:** Approved - Active Development

---

## 1. Overview

**Goal:** Build a VS Code extension that provides Vietnamese autocomplete with ghost text, powered by a local Python FastAPI backend.

**Core Philosophy:** Statistical autocomplete (rule-based/heuristic), NOT machine learning. Focus on frequency-based suggestions from personal corpus.

**Why VS Code Extension?**
- Leverages VS Code's built-in autocomplete UI (ghost text)
- Cross-platform support
- Easy to distribute via VS Code Marketplace
- Python backend handles heavy NLP processing

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  VS Code (Frontend)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Extension (TypeScript)                           │   │
│  │  - InlineCompletionsProvider                     │   │
│  │  - Auto-start Python server on activate          │   │
│  │  - Handle ghost text display                     │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP POST /api/suggest
                       │ { context, prefix }
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI Server                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  server.py                                      │   │
│  │  @app.post("/api/suggest")                      │   │
│  │  @app.post("/api/import")                      │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼─────────────────────────┐   │
│  │  Core Logic (Reuse from existing)                │   │
│  │  - src/core/suggestion_engine.py               │   │
│  │  - src/core/corpus_processor.py                │   │
│  │  - src/data/database.py                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Backend API

### 3.1 Endpoints

**GET /health**
```json
Response: { "status": "ok" }
```

**POST /api/suggest**
```json
Request:
{
  "context": "tôi đang ",
  "prefix": "đang"
}

Response:
{
  "suggestions": ["làm việc", "ăn", "nói", "viết", "đọc"]
}
```

**POST /api/import**
```json
Request:
{
  "folder_path": "C:/path/to/corpus"
}

Response:
{
  "success": true,
  "words": 1234,
  "bigrams": 5678,
  "error": null
}
```

**GET /api/status**
```json
Response:
{
  "corpus_imported": true,
  "word_count": 1234,
  "bigram_count": 5678,
  "dictionary_loaded": true
}
```

---

## 4. File Structure

### 4.1 Backend (Python)
```
writer/
├── server.py                     # FastAPI server (ALREADY IMPLEMENTED)
├── requirements-server.txt       # FastAPI dependencies (ALREADY IMPLEMENTED)
├── src/
│   ├── core/
│   │   ├── suggestion_engine.py  # Reuse existing
│   │   ├── corpus_processor.py  # Reuse existing
│   │   └── cache_manager.py     # Reuse existing
│   └── data/
│       ├── database.py           # Reuse existing
│       └── dictionary.py        # Reuse existing
└── data/
    ├── database.db               # SQLite database
    └── vietnamese_dict.txt      # Vietnamese dictionary
```

### 4.2 Extension (TypeScript)
```
writer/extension/
├── package.json                  # Extension manifest
├── tsconfig.json               # TypeScript config
├── src/
│   ├── extension.ts             # Main entry point
│   ├── inline-completions.ts    # InlineCompletionsProvider
│   └── python-server.ts         # Python server manager
├── .vscode/
│   └── launch.json              # Debug config
└── out/                        # Compiled JavaScript
```

---

## 5. Core Components

### 5.1 Python Backend (server.py)

Already implemented with FastAPI. Key features:
- CORS enabled for VS Code extension
- `/api/suggest` endpoint for autocomplete
- `/api/import` endpoint for corpus import
- Reuses existing suggestion_engine, corpus_processor, database

### 5.2 VS Code Extension

#### InlineCompletionsProvider
- Implements VS Code's `InlineCompletionsProvider` interface
- Fetches suggestions from Python backend via HTTP
- Returns ghost text suggestions
- Handles Tab key for acceptance

#### Python Server Manager
- Auto-starts Python server on extension activation
- Detects Python executable
- Manages server lifecycle (start/stop)
- Handles server errors gracefully

---

## 6. User Flow

### 6.1 First-Time Setup

```
1. Install VS Code extension (.vsix)
2. Open VS Code → Extension activates
3. Extension auto-starts Python server
4. User imports corpus via VS Code command
5. Extension shows "Corpus imported successfully"
6. Ready to use
```

### 6.2 Writing with Autocomplete

```
1. User types in any text file
2. On each word completion:
   a. Extension extracts context + prefix
   b. Sends HTTP request to Python backend
   c. Receives suggestions
   d. Shows ghost text for top suggestion
3. User presses Tab to accept
4. Ghost text is inserted
5. Continue typing
```

---

## 7. Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| API latency | < 50ms | With caching |
| API latency | < 100ms | Without caching |
| Server startup | < 3s | Python server init |
| Corpus import | ~1000 words/sec | Processing speed |
| Extension activation | < 1s | VS Code startup |

### 7.1 Optimization Strategies

1. **Caching:** Cache bigram results per previous_word
2. **Connection pooling:** Reuse HTTP connections
3. **Debouncing:** Wait for typing pause before API call
4. **Batch import:** Process corpus in single transaction

---

## 8. Dependencies

### 8.1 Backend

```txt
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
httpx==0.26.0
```

### 8.2 Extension

```json
{
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "18.x",
    "typescript": "^5.3.3",
    "@vscode/vsce": "^2.22.0"
  }
}
```

---

## 9. VS Code Commands

| Command | Description |
|---------|-------------|
| `vietnamese-autocomplete.importCorpus` | Import corpus folder |
| `vietnamese-autocomplete.refreshSuggestions` | Refresh suggestion cache |
| `vietnamese-autocomplete.openSettings` | Open extension settings |

---

## 10. Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `vietnameseAutocomplete.pythonServerUrl` | `http://127.0.0.1:8000` | Backend URL |
| `vietnameseAutocomplete.enableGhostText` | `true` | Show ghost text |
| `vietnameseAutocomplete.maxSuggestions` | `5` | Max suggestions |
| `vietnameseAutocomplete.debounceMs` | `100` | Typing debounce |

---

## 11. Implementation Status

| Component | Status |
|-----------|--------|
| Backend (server.py) | ✅ Implemented |
| FastAPI endpoints | ✅ Implemented |
| Extension structure | ✅ Implemented |
| InlineCompletionsProvider | ✅ Implemented |
| Python server manager | ✅ Implemented |
| Corpus import command | 🔲 To do |
| VS Code commands | 🔲 To do |
| Error handling | 🔲 To do |
| Testing | 🔲 To do |

---

## 12. Future Enhancements (Phase 2+)

### Phase 2: Phrase Completion
- Add trigram support
- Add phrase frequency table (2-5 word phrases)
- Mixed word + phrase suggestions

### Phase 3: Online Learning
- Real-time corpus update as user writes
- Background processing for new patterns

### Phase 4: Advanced Features
- Export/import database
- Multiple corpus support
- Statistics dashboard

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Python server not found | High | Show error message with instructions |
| Server startup timeout | Medium | Increase timeout, show loading state |
| API timeout | Low | Use VS Code's built-in timeout |
| Large corpus import | Medium | Background processing with progress |

---

## 14. Success Criteria

**MVP is complete when:**

- ✅ Python server starts on localhost:8000
- ✅ /api/suggest returns suggestions in <100ms
- ✅ /api/import processes corpus files
- ✅ VS Code extension activates without errors
- ✅ Ghost text appears while typing Vietnamese
- ✅ Tab accepts suggestion
- ✅ Extension can be packaged as .vsix

---

**Next Step:** Continue implementation based on implementation plan.
