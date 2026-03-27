/** VS Code InlineCompletionItemProvider implementation */

import * as vscode from 'vscode';
import * as http from 'http';

interface SuggestionResponse {
    suggestions: string[];
}

export class AutocompleteProvider implements vscode.InlineCompletionItemProvider {
    private serverUrl: string;

    constructor() {
        this.serverUrl = vscode.workspace
            .getConfiguration('vietnameseAutocomplete')
            .get('pythonServerUrl', 'http://127.0.0.1:8000');
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | null> {
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
        const contextText = words.length > 1 ? words.slice(0, -1).join(' ') + ' ' : '';

        try {
            const suggestions = await this.fetchSuggestions(contextText, prefix);

            if (suggestions.length === 0) {
                return null;
            }

            // Create inline completion items
            const items = suggestions.map((suggestion) => {
                const range = new vscode.Range(
                    position.with(undefined, position.character - prefix.length),
                    position
                );
                return new vscode.InlineCompletionItem(suggestion, range);
            });

            return items;
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
            return null;
        }
    }

    private async fetchSuggestions(context: string, prefix: string): Promise<string[]> {
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

    dispose(): void {}
}
