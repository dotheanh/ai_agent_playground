"use strict";
/** VS Code CompletionItemProvider - Dropdown list with 5 suggestions */
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
exports.DropdownCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const http = __importStar(require("http"));
class DropdownCompletionProvider {
    constructor() {
        this.serverUrl = vscode.workspace
            .getConfiguration('vietnameseAutocomplete')
            .get('pythonServerUrl', 'http://127.0.0.1:8000');
    }
    async provideCompletionItems(document, position, token, context) {
        if (token.isCancellationRequested) {
            return null;
        }
        // Only trigger on trigger characters (space, etc.)
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
            // Create completion items with icons and detail
            const items = suggestions.map((suggestion, index) => {
                const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
                // Add detail text showing it's from Vietnamese Autocomplete
                item.detail = `💡 Vietnamese Autocomplete ${index === 0 ? '(Best match)' : ''}`;
                // Add sort text to prioritize order
                item.sortText = String.fromCharCode(0 + index);
                // Add documentation
                item.documentation = new vscode.MarkdownString(`Vietnamese Autocomplete suggestion\n**Rank:** #${index + 1}`);
                return item;
            });
            return items;
        }
        catch (error) {
            console.error('Dropdown: Failed to fetch suggestions:', error);
            return null;
        }
    }
    async fetchSuggestions(context, prefix) {
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
                        const response = JSON.parse(responseBody);
                        resolve(response.suggestions);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    dispose() { }
}
exports.DropdownCompletionProvider = DropdownCompletionProvider;
//# sourceMappingURL=completions.js.map