# Vietnamese Autocomplete Writer - Design Specification

**Date:** 2026-03-27
**Project:** Autobiography Writing Assistant (MVP)
**Tech Stack:** Python + CustomTkinter + SQLite
**Status:** Draft for Review

---

## 1. Overview

**Goal:** Build a lightweight standalone text editor that provides real-time autocomplete suggestions based on user's personal writing style (statistical n-gram model).

**Core Philosophy:** Statistical autocomplete (rule-based/heuristic), NOT machine learning. Focus on frequency-based suggestions from personal corpus.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│              Main Application                    │
│  ┌─────────────────────────────────────────┐   │
│  │  UI Layer (CustomTkinter)               │   │
│  │  - TextEditor widget                    │   │
│  │  - SuggestionDropdown popup             │   │
│  │  - ImportCorpus dialog                  │   │
│  │  - SettingsPanel                        │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  Core Logic Layer                       │   │
│  │  - CorpusProcessor (tokenize, n-gram)   │   │
│  │  - SuggestionEngine (query, filter)     │   │
│  │  - CacheManager (prefix caching)        │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  Data Layer                             │   │
│  │  - SQLite database (bigram, unigram)    │   │
│  │  - Dictionary loader                    │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 2.2 Module Structure

```
writer/
├── main.py                    # Entry point
├── ui/
│   ├── __init__.py
│   ├── main_window.py        # Main application window
│   ├── text_editor.py        # Custom text widget with autocomplete
│   ├── suggestion_dropdown.py # Floating suggestion popup
│   └── dialogs.py            # Import corpus, settings dialogs
├── core/
│   ├── __init__.py
│   ├── corpus_processor.py   # Text preprocessing, tokenization
│   ├── suggestion_engine.py  # Query engine for suggestions
│   └── cache_manager.py      # Query result caching
├── data/
│   ├── __init__.py
│   ├── database.py           # SQLite connection, schema management
│   └── dictionary.py         # Vietnamese dictionary loader
├── utils/
│   ├── __init__.py
│   └── helpers.py            # Utility functions
└── resources/
    ├── database.db           # SQLite database (created on first run)
    └── vietnamese_dict.txt   # Vietnamese word dictionary
```

---

## 3. Database Schema

### 3.1 Tables

```sql
-- word_frequency: unigram statistics (single word frequency)
CREATE TABLE word_frequency (
    word TEXT PRIMARY KEY,
    freq INTEGER NOT NULL DEFAULT 0
);

-- bigram_frequency: pair statistics (word1 -> word2 frequency)
CREATE TABLE bigram_frequency (
    word1 TEXT NOT NULL,
    word2 TEXT NOT NULL,
    freq INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (word1, word2)
);
CREATE INDEX idx_bigram_word1 ON bigram_frequency(word1);

-- dictionary: Vietnamese fallback words
CREATE TABLE dictionary (
    word TEXT PRIMARY KEY,
    pos TEXT  -- part of speech: noun, verb, adj, adv, etc.
);

-- metadata: system metadata
CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### 3.2 Sample Data

```sql
-- word_frequency
INSERT INTO word_frequency VALUES ('làm', 512);
INSERT INTO word_frequency VALUES ('việc', 220);
INSERT INTO word_frequency VALUES ('bài', 150);

-- bigram_frequency
INSERT INTO bigram_frequency VALUES ('làm', 'việc', 120);
INSERT INTO bigram_frequency VALUES ('làm', 'bài', 60);
INSERT INTO bigram_frequency VALUES ('làm', 'người', 20);

-- dictionary
INSERT INTO dictionary VALUES ('việc', 'noun');
INSERT INTO dictionary VALUES ('vui', 'adj');
INSERT INTO dictionary VALUES ('văn', 'noun');
```

---

## 4. Core Algorithms

### 4.1 Text Preprocessing (CorpusProcessor)

```python
def preprocess_text(text: str) -> str:
    """
    Normalize text:
    - Replace multiple spaces with single space
    - Normalize punctuation
    - Remove extra newlines
    """
    # Implementation: regex-based normalization
    pass

def tokenize(text: str) -> list[str]:
    """
    Tokenize Vietnamese text using vnsegment.
    Returns list of words/phrases.
    """
    # Use vnsegment library for Vietnamese tokenization
    pass

def extract_ngrams(tokens: list[str], n: int) -> list[tuple]:
    """
    Extract n-grams from token list.
    Returns list of (word1, word2, ...) tuples.
    """
    pass
```

### 4.2 Corpus Import & Database Building

```python
def import_corpus(folder_path: str) -> None:
    """
    Import all .txt files from folder.
    1. Read each file
    2. Preprocess and tokenize
    3. Extract unigrams and bigrams
    4. Update frequency counts in DB
    """
    pass

def build_database(corpus_data: dict) -> None:
    """
    Build SQLite database from processed corpus.
    - Insert/update word_frequency
    - Insert/update bigram_frequency
    """
    pass
```

### 4.3 Suggestion Engine (Core Algorithm)

```python
def get_suggestions(context: str, prefix: str) -> list[str]:
    """
    Main autocomplete algorithm.

    Args:
        context: Text before cursor (e.g., "làm ")
        prefix: Current word being typed (e.g., "v")

    Returns:
        List of up to 5 suggestion strings (e.g., ["việc", "vui", "văn", ...])

    Algorithm:
    1. Extract previous_word from context (last word before cursor)
    2. Query bigram DB: SELECT word2, freq FROM bigram WHERE word1 = previous_word
    3. Filter results where word2 STARTS WITH prefix
    4. Sort by freq DESC
    5. Take top N results
    6. If len < 5: query dictionary for words STARTING WITH prefix
    7. Combine and return top 5
    """
    pass
```

### 4.4 Caching Strategy

```python
class CacheManager:
    """
    Cache query results for performance.

    Cache key: previous_word
    Cache value: (all_bigrams, sorted_by_freq)

    When user types "làm v":
    - First query "làm ": hit DB, cache result
    - Then query "làm v": filter cached result (no DB query)
    """

    def get_cached(self, word: str) -> Optional[list]:
        pass

    def cache(self, word: str, data: list) -> None:
        pass
```

---

## 5. UI Components

### 5.1 TextEditor Widget

```python
class TextEditor(tk.Text):
    """
    Custom text widget with autocomplete support.

    Features:
    - Intercept key events
    - Trigger suggestion on each keystroke
    - Handle Tab/Enter/Arrow keys for suggestion selection
    - Pass-through normal typing
    """

    def on_key_press(self, event):
        """
        Handle key events:
        - Tab: accept selected suggestion
        - Enter: accept suggestion + newline (optional)
        - Up/Down: navigate suggestions
        - Esc: hide suggestions
        - Other: trigger autocomplete + pass to text widget
        """
        pass
```

### 5.2 SuggestionDropdown

```python
class SuggestionDropdown:
    """
    Floating popup showing up to 5 suggestions.

    Features:
    - Position near cursor
    - Highlight matched prefix
    - Keyboard navigation (Up/Down)
    - Mouse click to select
    - Auto-hide on Esc or loss of focus
    """

    def show(self, suggestions: list[str], x: int, y: int):
        """Display dropdown at given coordinates."""
        pass

    def hide(self):
        """Hide dropdown."""
        pass

    def select_next(self):
        """Navigate to next suggestion."""
        pass

    def select_previous(self):
        """Navigate to previous suggestion."""
        pass
```

### 5.3 ImportCorpusDialog

```python
class ImportCorpusDialog:
    """
    Dialog for importing text corpus.

    Features:
    - Folder picker for selecting .txt files
    - Progress bar during import
    - Summary of imported files/words
    - Option to rebuild database
    """
    pass
```

---

## 6. User Flow

### 6.1 First-Time Setup

```
1. Launch app
2. Show "No corpus found" message
3. Prompt user to import corpus
4. User selects folder with .txt files
5. Process files, build database
6. Show summary (files imported, words learned)
7. Ready to write
```

### 6.2 Writing with Autocomplete

```
1. User types in text editor
2. On each keystroke:
   a. Extract context + prefix
   b. Query suggestion engine
   c. Show dropdown with suggestions
3. User navigates (Up/Down/Tab/Enter/Esc)
4. On selection: insert suggestion, clear dropdown
5. Continue typing
```

---

## 7. Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Query latency | < 50ms | With caching |
| Query latency | < 100ms | Without caching |
| Startup time | < 500ms | App launch |
| Corpus import | ~1000 words/sec | Processing speed |
| Memory usage | < 100MB | For ~100K words corpus |

### 7.1 Optimization Strategies

1. **Caching:** Cache bigram results per previous_word
2. **Indexing:** Index bigram_frequency.word1 for fast lookup
3. **Lazy loading:** Load dictionary only when needed
4. **Batch processing:** Import corpus in batches, not one-by-one

---

## 8. Dependencies

### 8.1 Core Dependencies

```txt
customtkinter>=5.2.0    # Modern UI framework
sqlite3                 # Built-in Python
vnsegment>=0.1.0        # Vietnamese tokenizer
```

### 8.2 Optional Dependencies

```txt
pyvi>=0.1.4             # Alternative Vietnamese tokenizer (more features)
openpyxl>=3.1.0         # For future: Excel export
```

---

## 9. Future Enhancements (Phase 2+)

### 9.1 Phase 2: Phrase Completion

- Add trigram_frequency table
- Add phrase_frequency table (2-5 word phrases)
- Implement weighted scoring (trigram * 3 + bigram * 1)
- Mixed mode: word + phrase suggestions

### 9.2 Phase 3: Online Learning

- Real-time corpus update as user writes
- Background processing for new patterns
- Adaptive frequency updates

### 9.3 Phase 4: Advanced Features

- Export/import database for backup
- Multiple corpus support (different writing styles)
- Statistics dashboard (most used words, patterns)
- Custom dictionary management

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| vnsegment not accurate | Medium | Allow manual corpus correction |
| Performance degradation with large corpus | Medium | Implement caching, indexing |
| Dictionary not comprehensive | Low | Allow user to add custom words |
| Memory usage too high | Medium | Use SQLite efficiently, batch operations |

---

## 11. Unresolved Questions

1. **Dictionary source:** Where to get Vietnamese dictionary file? (vnsegment built-in? VnDict?)
2. **Corpus folder location:** Default to app folder or user-specified?
3. **Database auto-rebuild:** When to prompt user to rebuild after new corpus import?

---

## 12. Success Criteria

**MVP is complete when:**

- ✅ Can import .txt files from a folder
- ✅ Builds bigram frequency database
- ✅ Shows top 5 autocomplete suggestions as user types
- ✅ Filters suggestions by prefix being typed
- ✅ Falls back to dictionary when corpus has < 5 suggestions
- ✅ Accepts suggestion with Tab/Enter
- ✅ Navigates suggestions with Up/Down
- ✅ Hides suggestions with Esc
- ✅ Query latency < 100ms

---

**Next Step:** If approved, create implementation plan using `/superpowers:writing-plans`.
