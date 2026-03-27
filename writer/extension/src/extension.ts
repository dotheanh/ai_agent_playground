/** Main extension entry point */

import * as vscode from 'vscode';
import { startPythonServer, stopPythonServer } from './python-server';
import { AutocompleteProvider } from './inline-completions';

interface ImportResult {
    success: boolean;
    words: number;
    bigrams: number;
    error: string | null;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Vietnamese Autocomplete extension is activating');

    // Start Python server
    try {
        await startPythonServer();
        console.log('Python server started successfully');
    } catch (error) {
        console.error('Failed to start Python server:', error);
        vscode.window.showWarningMessage('Failed to start Python server. Please run "python server.py" manually.');
    }

    // Register inline completions provider
    const provider = new AutocompleteProvider();
    const disposable = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**/*' },
        provider
    );

    context.subscriptions.push(disposable);

    // Register Import Corpus command
    const importCommand = vscode.commands.registerCommand(
        'vietnameseAutocomplete.importCorpus',
        async () => {
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

                    const result = await response.json() as ImportResult;

                    if (result.success) {
                        vscode.window.showInformationMessage(
                            `Imported ${result.words} words, ${result.bigrams} bigrams!`
                        );
                    } else {
                        vscode.window.showErrorMessage(`Import failed: ${result.error}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(
                        'Failed to import corpus. Make sure the Python server is running (python server.py)'
                    );
                }
            }
        }
    );

    context.subscriptions.push(importCommand);

    // Register Open Settings command
    const settingsCommand = vscode.commands.registerCommand(
        'vietnameseAutocomplete.openSettings',
        () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'vietnameseAutocomplete');
        }
    );

    context.subscriptions.push(settingsCommand);

    console.log('Vietnamese Autocomplete extension is active');
}

export function deactivate() {
    stopPythonServer();
}
