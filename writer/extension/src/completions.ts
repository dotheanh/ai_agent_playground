/** Vietnamese Autocomplete - QuickPick-based dropdown */

import * as vscode from 'vscode';
import * as http from 'http';

interface SuggestionResponse {
    suggestions: string[];
}

let lastSuggestions: string[] = [];
let lastPrefix: string = '';

export async function showSuggestionsQuickPick(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const position = editor.selection.active;
    const line = editor.document.lineAt(position);
    const textBeforeCursor = line.text.substring(0, position.character);

    // Extract context and prefix
    const words = textBeforeCursor.split(/\s+/);
    if (words.length === 0 || words[words.length - 1] === '') {
        return;
    }

    const prefix = words[words.length - 1];
    const contextText = words.length > 1 ? words.slice(0, -1).join(' ') + ' ' : '';

    // Fetch suggestions from server
    try {
        const suggestions = await fetchSuggestions(contextText, prefix);
        if (suggestions.length === 0) {
            return;
        }

        lastSuggestions = suggestions;
        lastPrefix = prefix;

        // Show QuickPick
        const items = suggestions.map((suggestion, index) => ({
            label: suggestion,
            description: index === 0 ? '💡 Best match' : `#${index + 1}`
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Suggestions for "${prefix}" (${suggestions.length} results)`,
            matchOnDescription: true
        });

        if (selected) {
            // Accept the suggestion
            await acceptSuggestion(editor, position, prefix, selected.label);
        }
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        vscode.window.showErrorMessage('Vietnamese Autocomplete: Failed to connect to server');
    }
}

async function acceptSuggestion(
    editor: vscode.TextEditor,
    position: vscode.Position,
    prefix: string,
    suggestion: string
): Promise<void> {
    // Calculate the range to replace (from start of prefix to cursor)
    const startPos = new vscode.Position(position.line, position.character - prefix.length);
    const range = new vscode.Range(startPos, position);

    // Replace prefix with full suggestion
    await editor.edit(editBuilder => {
        editBuilder.replace(range, suggestion);
    });

    // Move cursor to end of inserted text
    const newPos = new vscode.Position(position.line, position.character - prefix.length + suggestion.length);
    editor.selection = new vscode.Selection(newPos, newPos);
}

async function fetchSuggestions(context: string, prefix: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ context, prefix });

        const req = http.request({
            hostname: '127.0.0.1',
            port: 8000,
            path: '/api/suggest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
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
        req.write(postData);
        req.end();
    });
}
