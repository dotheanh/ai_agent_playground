# VS Code Extension + Python Backend - Design Specification

**Date:** 2026-03-27
**Project:** Vietnamese Autocomplete - VS Code Extension Hybrid
**Tech Stack:** FastAPI (Python) + VS Code Extension (TypeScript)
**Status:** Approved

---

## 1. Overview

**Goal:** Build a VS Code extension that provides Vietnamese autocomplete with ghost text, powered by a local Python FastAPI backend.

**Architecture:**
- **Backend:** Reuse existing Python code (suggestion_engine, corpus_processor, database) + FastAPI server
- **Frontend:** VS Code Extension with InlineCompletionsProvider for ghost text

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  VS Code Extension                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  extension.ts (TypeScript)                      │   │
│  │  - InlineCompletionsProvider                    │   │
│  │  - HTTP calls to localhost:8000                 │   │
│  │  - Auto-start Python server on activate         │   │
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
│  │      suggestions = engine.get_suggestions(...)  │   │
│  │      return {"suggestions": suggestions}        │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼─────────────────────────┐   │
│  │  Reuse Existing Code (100%)                    │   │
│  │  - src/core/suggestion_engine.py               │   │
│  │  - src/core/corpus_processor.py                │   │
│  │  - src/data/database.py                        │   │
│  └──────────────────────┬─────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼─────────────────────────┐   │
│  │  SQLite Database (data/database.db)            │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Backend API

### 3.1 Endpoints

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
  "bigrams": 5678
}
```

---

## 4. File Structure

### Backend (Python)
```
writer/
├── server.py                 # FastAPI server (NEW)
├── src/
│   ├── core/
│   │   ├── suggestion_engine.py    # Reuse existing
│   │   └── corpus_processor.py     # Reuse existing
│   └── data/
│       ├── database.py             # Reuse existing
│       └── dictionary.py           # Reuse existing
└── data/
    └── database.db                 # SQLite database
```

### Extension (TypeScript)
```
writer-extension/
├── src/
│   ├── extension.ts          # Main extension entry
│   ├── inline-completions.ts # InlineCompletionsProvider
│   └── python-server.ts      # Start/stop Python server
├── package.json
└── tsconfig.json
```

---

## 5. Implementation Phases

### Phase 1: Python FastAPI Server (2-3 hours)
- Create `server.py` with FastAPI
- Add `/api/suggest` endpoint
- Add `/api/import` endpoint
- Add CORS middleware
- Test with curl/Postman

### Phase 2: VS Code Extension (3-4 hours)
- Initialize extension with Yo Generator
- Implement InlineCompletionsProvider
- HTTP client for API calls
- Auto-start Python server on activate
- Error handling & fallback

### Phase 3: Integration & Testing (1-2 hours)
- Package extension (.vsix)
- Test in VS Code
- Performance optimization
- Documentation

---

## 6. Dependencies

### Backend
```txt
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
fastapi-cors==0.0.6
```

### Extension
```json
{
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "typescript": "^5.3.3",
    "@vscode/vsce": "^2.22.0"
  }
}
```

---

## 7. Success Criteria

**Backend:**
- ✅ Server starts on localhost:8000
- ✅ /api/suggest returns suggestions in <50ms
- ✅ /api/import processes corpus files

**Extension:**
- ✅ Ghost text appears while typing
- ✅ Tab accepts suggestion
- ✅ Up/Down navigates suggestions
- ✅ Python server auto-starts

---

**Next Step:** Implementation plan with writing-plans skill.
