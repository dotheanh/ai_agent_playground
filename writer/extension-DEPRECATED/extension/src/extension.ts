/** Main extension entry point */

import * as vscode from 'vscode';
import { startPythonServer, stopPythonServer } from './python-server';
import { AutocompleteProvider } from './inline-completions';
import { showSuggestionsQuickPick } from './completions';

interface ImportResult {
    success: boolean;
    words: number;
    bigrams: number;
    error: string | null;
}

async function disableConflictingSettings(): Promise<void> {
    /** Automatically disable VS Code settings that conflict with our extension */
    const config = vscode.workspace.getConfiguration('editor');

    // Check for conflicts
    const quickSuggestions = config.get('quickSuggestions');
    const wordBasedSuggestions = config.get('wordBasedSuggestions');
    const inlineSuggest = config.get('inlineSuggest.enabled');

    // Only warn if VS Code built-in suggestions are on
    const hasConflicts = quickSuggestions !== false || wordBasedSuggestions !== 'off';

    if (hasConflicts) {
        const choice = await vscode.window.showInformationMessage(
            '⚠️ VS Code built-in suggestions may conflict with this extension.',
            'Show Settings',
            'Ignore'
        );

        if (choice === 'Show Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'editor.quickSuggestions');
        }
    }

    console.log('Vietnamese Autocomplete settings checked');
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Vietnamese Autocomplete extension is activating');

    // Check conflicting VS Code settings
    await disableConflictingSettings();

    // Start Python server
    try {
        await startPythonServer();
        console.log('Python server started successfully');
    } catch (error) {
        console.error('Failed to start Python server:', error);
        vscode.window.showWarningMessage('Failed to start Python server. Please run "python server.py" manually.');
    }

    // Register inline completions provider (ghost text)
    const inlineProvider = new AutocompleteProvider();
    const inlineDisposable = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**/*' },
        inlineProvider
    );
    context.subscriptions.push(inlineDisposable);
    console.log('Registered inline completion provider (ghost text)');

    // Register command to show suggestions QuickPick
    const showSuggestionsDisposable = vscode.commands.registerCommand(
        'vietnameseAutocomplete.showSuggestions',
        async () => {
            await showSuggestionsQuickPick();
        }
    );
    context.subscriptions.push(showSuggestionsDisposable);
    console.log('Registered showSuggestions command');

    // Register keyboard shortcut: Ctrl+Space to show suggestions
    const keybindingDisposable = vscode.commands.registerCommand(
        '_vietnameseAutocomplete.trigger',
        async () => {
            await showSuggestionsQuickPick();
        }
    );
    context.subscriptions.push(keybindingDisposable);
    console.log('Registered keyboard shortcut (Ctrl+Space)');

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
                            `✅ Imported ${result.words} words, ${result.bigrams} bigrams!`
                        );
                    } else {
                        vscode.window.showErrorMessage(`❌ Import failed: ${result.error}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(
                        '❌ Failed to import corpus. Make sure Python server is running (python server.py)'
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
