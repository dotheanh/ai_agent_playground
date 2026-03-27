/** Main extension entry point */

import * as vscode from 'vscode';
import { startPythonServer, stopPythonServer } from './python-server';
import { AutocompleteProvider } from './inline-completions';
import { DropdownCompletionProvider } from './completions';

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
    const hasConflicts = quickSuggestions !== false || wordBasedSuggestions !== 'off';

    if (hasConflicts) {
        const choice = await vscode.window.showInformationMessage(
            'Vietnamese Autocomplete: Disable conflicting VS Code suggestions?',
            'Disable Conflicts',
            'Ignore'
        );

        if (choice === 'Disable Conflicts') {
            // Disable quick suggestions
            await config.update('quickSuggestions', false, vscode.ConfigurationTarget.Global);

            // Disable word-based suggestions
            await config.update('wordBasedSuggestions', 'off', vscode.ConfigurationTarget.Global);

            // Disable VS Code's inline suggestions
            await config.update('inlineSuggest.enabled', false, vscode.ConfigurationTarget.Global);

            // Also disable suggestions for specific languages if possible
            await config.update('suggest.showWords', false, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage('Conflicting settings disabled! Restart may be required.');
            console.log('Disabled conflicting VS Code suggestions');
        }
    }
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Vietnamese Autocomplete extension is activating');

    // Disable conflicting VS Code settings
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

    // Register dropdown completion provider (shows 5 suggestions)
    const dropdownProvider = new DropdownCompletionProvider();
    const dropdownDisposable = vscode.languages.registerCompletionItemProvider(
        { pattern: '**/*' },
        dropdownProvider,
        ' '  // Trigger on space character
    );
    context.subscriptions.push(dropdownDisposable);
    console.log('Registered dropdown completion provider (5 suggestions)');

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
