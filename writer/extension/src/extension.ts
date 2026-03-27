/** Main extension entry point */

import * as vscode from 'vscode';
import { startPythonServer, stopPythonServer } from './python-server';
import { AutocompleteProvider } from './inline-completions';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Vietnamese Autocomplete extension is activating');

    // Start Python server
    try {
        await startPythonServer();
        console.log('Python server started successfully');
    } catch (error) {
        console.error('Failed to start Python server:', error);
    }

    // Register inline completions provider
    const provider = new AutocompleteProvider();
    const disposable = vscode.languages.registerInlineCompletionItemProvider(
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
