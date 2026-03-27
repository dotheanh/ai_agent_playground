# Vietnamese Autocomplete Writer

A lightweight text editor that provides real-time autocomplete suggestions based on your personal writing style.

## Features

- Import personal text corpus (.txt files)
- Real-time Vietnamese autocomplete
- Frequency-based suggestions
- Dictionary fallback

## Installation

```bash
pip install -r requirements.txt
```

## Usage

1. Run the application:
   ```bash
   python main.py
   ```

2. Import your text corpus:
   - Click "Import Corpus" button
   - Select folder containing .txt files
   - Wait for processing

3. Start writing:
   - Type normally
   - Autocomplete suggestions appear automatically
   - Use Tab/Enter to accept, Arrow keys to navigate, Esc to dismiss

## Keyboard Shortcuts

- **Tab**: Accept suggestion
- **Enter**: Accept suggestion + newline
- **Up/Down**: Navigate suggestions
- **Esc**: Hide suggestions

## Project Structure

```
writer/
├── main.py              # Entry point
├── src/
│   ├── ui/              # UI components
│   ├── core/            # Core logic
│   └── data/            # Data layer
├── data/                # Database storage
├── input/               # Corpus files
└── tests/               # Unit tests
```

## License

MIT
