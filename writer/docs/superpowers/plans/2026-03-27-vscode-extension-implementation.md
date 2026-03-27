# VS Code Extension + Python Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension with Vietnamese autocomplete powered by a local FastAPI backend.

**Architecture:** FastAPI server reuses existing Python code (suggestion_engine, database) + VS Code Extension with InlineCompletionsProvider for ghost text.

**Tech Stack:** FastAPI (Python), VS Code Extension API (TypeScript), HTTP REST API

---

## File Structure

### Files to Create (Backend)
```
writer/
├── server.py                     # FastAPI server
├── requirements-server.txt       # FastAPI dependencies
└── extension/                    # VS Code Extension
    ├── package.json              # Extension manifest
    ├── tsconfig.json             # TypeScript config
    ├── src/
    │   ├── extension.ts          # Extension entry point
    │   ├── inline-completions.ts # InlineCompletionsProvider
    │   └── python-server.ts      # Python server manager
    └── .vscode/
        └── launch.json           # Debug config
```

---

## Task 1: Setup FastAPI Backend

**Files:**
- Create: `writer/server.py`
- Create: `writer/requirements-server.txt`

- [ ] **Step 1: Create requirements-server.txt**

```txt
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
httpx==0.26.0
```

- [ ] **Step 2: Create server.py with FastAPI app**

```python
"""FastAPI server for Vietnamese autocomplete."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.core.suggestion_engine import SuggestionEngine
from src.core.corpus_processor import CorpusProcessor
from src.data.database import init_database, batch_update_frequencies

app = FastAPI(title="Vietnamese Autocomplete API")

# Enable CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and engine
init_database()
engine = SuggestionEngine()
processor = CorpusProcessor()


class SuggestRequest(BaseModel):
    context: str
    prefix: str


class SuggestResponse(BaseModel):
    suggestions: list[str]


class ImportRequest(BaseModel):
    folder_path: str


class ImportResponse(BaseModel):
    success: bool
    words: int
    bigrams: int
    error: str | None = None


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/suggest", response_model=SuggestResponse)
async def get_suggestions(request: SuggestRequest):
    """Get autocomplete suggestions."""
    try:
        suggestions = engine.get_suggestions(request.context, request.prefix)
        return SuggestResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/import", response_model=ImportResponse)
async def import_corpus(request: ImportRequest):
    """Import corpus from folder."""
    try:
        word_freq, bigram_freq = processor.process_corpus_folder(request.folder_path)
        batch_update_frequencies(word_freq, bigram_freq)
        return ImportResponse(
            success=True,
            words=len(word_freq),
            bigrams=len(bigram_freq)
        )
    except Exception as e:
        return ImportResponse(
            success=False,
            words=0,
            bigrams=0,
            error=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

- [ ] **Step 3: Install dependencies**

Run: `pip install -r requirements-server.txt`

- [ ] **Step 4: Test server**

Run: `python server.py`

Expected: Server starts on http://127.0.0.1:8000

- [ ] **Step 5: Test API endpoint**

Run: `curl http://127.0.0.1:8000/health`

Expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add server.py requirements-server.txt
git commit -m "feat: add FastAPI server with autocomplete API"
```

---

## Task 2: Initialize VS Code Extension

**Files:**
- Create: `writer/extension/package.json`
- Create: `writer/extension/tsconfig.json`
- Create: `writer/extension/.vscode/launch.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "vietnamese-autocomplete",
  "displayName": "Vietnamese Autocomplete",
  "description": "AI-powered Vietnamese autocomplete for your writing style",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "configuration": {
      "title": "Vietnamese Autocomplete",
      "properties": {
        "vietnameseAutocomplete.pythonServerUrl": {
          "type": "string",
          "default": "http://127.0.0.1:8000",
          "description": "URL of the Python autocomplete server"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "18.x",
    "typescript": "^5.3.3",
    "@vscode/vsce": "^2.22.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

- [ ] **Step 3: Create .vscode/launch.json**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add extension/
git commit -m "feat: initialize VS Code extension structure"
```

---

## Task 3: Implement Inline Completions Provider

**Files:**
- Create: `writer/extension/src/extension.ts`
- Create: `writer/extension/src/inline-completions.ts`
- Create: `writer/extension/src/python-server.ts`

- [ ] **Step 1: Create python-server.ts**

```typescript
/** Manages the Python server lifecycle */

import * as cp from 'child_process';
import * as path from 'path';

let pythonProcess: cp.ChildProcess | undefined;

export async function startPythonServer(): Promise<boolean> {
    if (pythonProcess) {
        return true;
    }

    const serverPath = path.join(__dirname, '..', '..', 'server.py');

    return new Promise((resolve) => {
        pythonProcess = cp.spawn('python', [serverPath], {
            detached: false
        });

        pythonProcess.stdout?.on('data', (data) => {
            console.log(`Python server: ${data}`);
        });

        pythonProcess.stderr?.on('data', (data) => {
            console.error(`Python server error: ${data}`);
        });

        // Wait for server to start
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
}

export function stopPythonServer(): void {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = undefined;
    }
}
```

- [ ] **Step 2: Create inline-completions.ts**

```typescript
/** VS Code InlineCompletionsProvider implementation */

import * as vscode from 'vscode';
import * as http from 'http';

interface SuggestionResponse {
    suggestions: string[];
}

export class AutocompleteProvider implements vscode.InlineCompletionsProvider {
    private serverUrl: string;

    constructor() {
        this.serverUrl = vscode.workspace
            .getConfiguration('vietnameseAutocomplete')
            .get('pythonServerUrl', 'http://127.0.0.1:8000');
    }

    async provideInlineCompletions(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletions<vscode.InlineCompletionItem> | null> {
        if (token.isCancellationRequested) {
            return null;
        }

        // Get text before cursor
        const line = document.lineAt(position.line);
        const textBeforeCursor = line.text.substring(0, position.character);

        // Extract context and prefix
        const words = textBeforeCursor.split(/\s+/);
        if (words.length === 0 || words[words.length - 1] === '') {
            return null;
        }

        const prefix = words[words.length - 1];
        const context = words.length > 1 ? words.slice(0, -1).join(' ') + ' ' : '';

        try {
            const suggestions = await this.fetchSuggestions(context, prefix);

            if (suggestions.length === 0) {
                return null;
            }

            // Create inline completion items
            const items = suggestions.map((suggestion, index) => ({
                insertText: suggestion,
                range: new vscode.Range(
                    position.with(undefined, position.character - prefix.length),
                    position
                ),
                command: {
                    title: 'Accept Suggestion',
                    command: 'vietnameseAutocomplete.accept',
                    arguments: [suggestion]
                }
            }));

            return {
                items: items,
                cacheId: '1'
            };
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
            return null;
        }
    }

    private async fetchSuggestions(context: string, prefix: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ context, prefix });

            const options = {
                hostname: '127.0.0.1',
                port: 8000,
                path: '/api/suggest',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = http.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => responseBody += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseBody) as SuggestionResponse;
                        resolve(response.suggestions);
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    dispose(): void {}
}
```

- [ ] **Step 3: Create extension.ts**

```typescript
/** Main extension entry point */

import * as vscode from 'vscode';
import { startPythonServer, stopPythonServer } from './python-server';
import { AutocompleteProvider } from './inline-completions';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Vietnamese Autocomplete extension is activating');

    // Start Python server
    await startPythonServer();

    // Register inline completions provider
    const provider = new AutocompleteProvider();
    const disposable = vscode.languages.registerInlineCompletionsProvider(
        { pattern: '**/*' },
        provider
    );

    context.subscriptions.push(disposable);

    // Register accept command
    const acceptCommand = vscode.commands.registerCommand(
        'vietnameseAutocomplete.accept',
        (suggestion: string) => {
            console.log('Accepted suggestion:', suggestion);
        }
    );

    context.subscriptions.push(acceptCommand);

    console.log('Vietnamese Autocomplete extension is active');
}

export function deactivate() {
    stopPythonServer();
}
```

- [ ] **Step 4: Compile extension**

Run: `cd extension && npm install && npm run compile`

- [ ] **Step 5: Commit**

```bash
git add extension/src/
git commit -m "feat: implement VS Code inline completions provider"
```

---

## Task 4: Integration & Testing

- [ ] **Step 1: Test Python server**

Run: `python server.py`

Expected: Server starts on http://127.0.0.1:8000

- [ ] **Step 2: Test API endpoint**

Run:
```bash
curl -X POST http://127.0.0.1:8000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"context": "tôi ", "prefix": "tôi"}'
```

Expected: `{"suggestions":["làm việc","đã từng",...]}`

- [ ] **Step 3: Package extension**

Run: `cd extension && vsce package`

Expected: Creates `vietnamese-autocomplete-0.1.0.vsix`

- [ ] **Step 4: Install extension in VS Code**

Run: `code --install-extension vietnamese-autocomplete-0.1.0.vsix`

- [ ] **Step 5: Test in VS Code**
- Open any text file
- Type Vietnamese text
- Verify ghost text appears
- Test Tab to accept

- [ ] **Step 6: Commit**

```bash
git add extension/
git commit -m "feat: complete VS Code extension integration"
```

---

## Success Criteria

**Backend:**
- ✅ Server starts on localhost:8000
- ✅ /api/suggest returns suggestions in <50ms
- ✅ /api/import processes corpus files

**Extension:**
- ✅ Ghost text appears while typing
- ✅ Tab accepts suggestion
- ✅ Python server auto-starts on extension activate
- ✅ Extension can be packaged and installed

---

## Unresolved Questions

1. **Python path detection:** Should extension auto-detect Python path or use system default?
2. **Server startup timeout:** How long to wait for Python server to start?
3. **Error fallback:** What to do when Python server is unavailable?

---

**Plan saved to:** `docs/superpowers/plans/2026-03-27-vscode-extension-implementation.md`

---

**Plan complete! Two execution options:**

**1. Subagent-Driven (recommended)** - Em dispatch subagent cho từng task, review giữa các bước, nhanh hơn

**2. Inline Execution** - Em thực hiện trực tiếp trong session này, batch execution với checkpoints

**Anh muốn chọn cách nào?**
