"use strict";
/** Main extension entry point */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const python_server_1 = require("./python-server");
const inline_completions_1 = require("./inline-completions");
async function activate(context) {
    console.log('Vietnamese Autocomplete extension is activating');
    // Start Python server
    try {
        await (0, python_server_1.startPythonServer)();
        console.log('Python server started successfully');
    }
    catch (error) {
        console.error('Failed to start Python server:', error);
        vscode.window.showWarningMessage('Failed to start Python server. Please run "python server.py" manually.');
    }
    // Register inline completions provider
    const provider = new inline_completions_1.AutocompleteProvider();
    const disposable = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**/*' }, provider);
    context.subscriptions.push(disposable);
    // Register Import Corpus command
    const importCommand = vscode.commands.registerCommand('vietnameseAutocomplete.importCorpus', async () => {
        const folder = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            openLabel: 'Select Corpus Folder'
        });
        if (folder && folder.length > 0) {
            const folderPath = folder[0].fsPath;
            const serverUrl = vscode.workspace
                .getConfiguration('vietnameseAutocomplete')
                .get('pythonServerUrl', 'http://127.0.0.1:8000');
            try {
                const response = await fetch(`${serverUrl}/api/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folder_path: folderPath })
                });
                const result = await response.json();
                if (result.success) {
                    vscode.window.showInformationMessage(`Imported ${result.words} words, ${result.bigrams} bigrams!`);
                }
                else {
                    vscode.window.showErrorMessage(`Import failed: ${result.error}`);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to import corpus. Make sure the Python server is running (python server.py)');
            }
        }
    });
    context.subscriptions.push(importCommand);
    // Register Open Settings command
    const settingsCommand = vscode.commands.registerCommand('vietnameseAutocomplete.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'vietnameseAutocomplete');
    });
    context.subscriptions.push(settingsCommand);
    console.log('Vietnamese Autocomplete extension is active');
}
function deactivate() {
    (0, python_server_1.stopPythonServer)();
}
//# sourceMappingURL=extension.js.map