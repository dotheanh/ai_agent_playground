# VS Code Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans

**Goal:** Build a VS Code extension with Vietnamese autocomplete powered by FastAPI backend.

**Architecture:** VS Code Extension (TypeScript) + FastAPI Server (Python) + SQLite Database

**Tech Stack:** FastAPI, VS Code Extension API, TypeScript, SQLite

---

## File Structure

```
writer/
├── server.py                     # FastAPI server ✅
├── requirements-server.txt       # ✅
├── extension/                    # VS Code Extension
│   ├── package.json             # ✅
│   ├── tsconfig.json            # ✅
│   ├── src/
│   │   ├── extension.ts         # ✅
│   │   ├── inline-completions.ts # ✅
│   │   └── python-server.ts     # ✅
│   └── out/                     # Compiled
├── src/
│   ├── core/                    # Core logic
│   │   ├── suggestion_engine.py  # ✅
│   │   ├── corpus_processor.py  # ✅
│   │   └── cache_manager.py     # ✅
│   └── data/
│       ├── database.py           # ✅
│       └── dictionary.py        # ✅
└── data/
    ├── database.db               # SQLite
    └── vietnamese_dict.txt      # Dictionary
```

---

## Phase 1: Backend Setup ✅

Already completed:
- `server.py` - FastAPI with /api/suggest, /api/import, /health
- `requirements-server.txt` - fastapi, uvicorn, pydantic

**Status:** ✅ Ready

---

## Phase 2: Extension Setup ✅

Already completed:
- `extension/package.json` - Extension manifest
- `extension/tsconfig.json` - TypeScript config
- `extension/src/extension.ts` - Main entry point
- `extension/src/inline-completions.ts` - InlineCompletionsProvider
- `extension/src/python-server.ts` - Python server manager

**Status:** ✅ Ready

---

## Phase 3: Complete & Test Extension

**Files to modify:**
- `extension/package.json` - Add commands
- `extension/src/extension.ts` - Add command handlers

### Task 1: Add VS Code Commands

**Files:**
- Modify: `extension/package.json`
- Modify: `extension/src/extension.ts`

- [ ] **Step 1: Update package.json with commands**

```json
{
  "contributes": {
    "commands": [
      {
        "command": "vietnamese-autocomplete.importCorpus",
        "title": "Import Corpus",
        "category": "Vietnamese Autocomplete"
      },
      {
        "command": "vietnamese-autocomplete.openSettings",
        "title": "Open Settings",
        "category": "Vietnamese Autocomplete"
      }
    ],
    "configuration": {
      "title": "Vietnamese Autocomplete",
      "properties": {
        "vietnameseAutocomplete.pythonServerUrl": {
          "type": "string",
          "default": "http://127.0.0.1:8000"
        }
      }
    }
  }
}
```

- [ ] **Step 2: Add command handlers to extension.ts**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export async function activate(context: vscode.ExtensionContext) {
    // Start Python server
    await startPythonServer();

    // Register inline completions provider
    const provider = new AutocompleteProvider();
    const disposable = vscode.languages.registerInlineCompletionsProvider(
        { pattern: '**/*' },
        provider
    );
    context.subscriptions.push(disposable);

    // Register Import Corpus command
    const importCommand = vscode.commands.registerCommand(
        'vietnamese-autocomplete.importCorpus',
        async () => {
            const folder = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                openLabel: 'Select Corpus Folder'
            });

            if (folder.length > 0) {
                await importCorpus(folder[0].fsPath);
            }
        }
    );
    context.subscriptions.push(importCommand);
}

async function importCorpus(folderPath: string): Promise<void> {
    // Call API to import corpus
    const serverUrl = vscode.workspace
        .getConfiguration('vietnameseAutocomplete')
        .get('pythonServerUrl', 'http://127.0.0.1:8000');

    const response = await fetch(`${serverUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_path: folderPath })
    });

    const result = await response.json();

    if (result.success) {
        vscode.window.showInformationMessage(
            `Imported ${result.words} words, ${result.bigrams} bigrams!`
        );
    } else {
        vscode.window.showErrorMessage(`Import failed: ${result.error}`);
    }
}

async function startPythonServer(): Promise<void> {
    const serverPath = path.join(__dirname, '..', '..', 'server.py');

    return new Promise((resolve) => {
        const proc = spawn('python', [serverPath], {
            detached: true,
            stdio: 'ignore'
        });

        // Wait for server to start
        setTimeout(() => resolve(), 2000);
    });
}
```

- [ ] **Step 3: Compile extension**

```bash
cd extension
npm install
npm run compile
```

- [ ] **Step 4: Commit**

```bash
git add extension/
git commit -m "feat: add VS Code commands for corpus import"
```

---

### Task 2: Test Integration

- [ ] **Step 1: Start Python server**

```bash
cd writer
python server.py
```

- [ ] **Step 2: Test API**

```bash
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 3: Package extension**

```bash
cd extension
vsce package
```

- [ ] **Step 4: Install and test in VS Code**

```bash
code --install-extension vietnamese-autocomplete-0.1.0.vsix
```

- [ ] **Step 5: Commit**

```bash
git add extension/*.vsix
git commit -m "feat: package VS Code extension as .vsix"
```

---

## Success Criteria

**Backend:**
- ✅ Server starts on localhost:8000
- ✅ /api/suggest returns suggestions
- ✅ /api/import processes corpus files

**Extension:**
- ✅ Extension activates without errors
- ✅ Inline completions provider registered
- ✅ Ghost text appears while typing
- ✅ Tab accepts suggestion
- ✅ Import Corpus command works
- ✅ Extension can be packaged

---

## Unresolved Questions

1. **Python path:** Auto-detect or require user configuration?
2. **Server port:** Use fixed port 8000 or configurable?
3. **Corpus location:** Default to workspace or user-specified?

---

**Plan saved to:** `plans/260327-1615-vscode-extension-focus/`
