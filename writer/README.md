# Vietnamese Autocomplete Writer

A lightweight standalone text editor that provides real-time Vietnamese autocomplete suggestions based on your personal writing style.

**No VS Code conflicts. No external dependencies. Just works.**

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install customtkinter
```

### 2. Run the App

```bash
python main.py
```

### 3. Import Your Corpus

Click **"Import Corpus"** button → Select a folder with `.txt` files (your old writings, diaries, etc.)

**Done!** The app will remember your corpus next time you open it.

---

## ✨ Features

### Autocomplete
- **Ghost Text** - Top-1 suggestion hiển thị mờ ngay tại con trỏ
- **Dropdown List** - Top 5 suggestions ngay sát vị trí gõ (không đánh số, width tự fit theo option dài nhất)
- **Frequency-based** - Learns from your writing style
- **Dictionary Fallback** - Works even without corpus

### Smart Typing (Non-intrusive)
- **Không ép lúc bấm dấu** - App không tự chèn `.`/`,` hay auto-cap ngay khi anh nhấn phím
- **Chuẩn hoá khi bấm Space** - Sau khi hoàn tất từ + Space, app mới kiểm tra/sửa spacing quanh `.` `,`
- **Auto capitalize theo ngữ cảnh** - Viết hoa từ đầu dòng và từ đầu tiên sau dấu chấm (khi bấm Space)
- **Vietnamese support** - Built-in Vietnamese dictionary, xử lý Unicode tiếng Việt tốt hơn khi normalize theo dòng hiện tại

### Persistent Storage
- **Auto-load corpus** - No need to re-import on restart
- **SQLite database** - Fast and reliable
- **Hot reload engine after import** - Import xong là dùng ngay, cache tự clear/reload

### Case-Sensitive
- **Preserves your writing style** - "Tôi" and "tôi" are treated as different words
- **Exact matches** - Suggestions match your original capitalization
- **Clean suggestions** - Tự lọc dấu câu thừa ở cuối (`.` `,` `;` `:` `!` `?`) trước khi hiển thị suggestion

### Server Logging
- **Import logs** - Log chi tiết kết quả import corpus (word count, bigram count, top bigrams)
- **Debug logs** - Log request suggest/import để theo dõi hành vi runtime dễ hơn

### VS Code Extension Status
- **Deprecated** - Hiện tại tập trung hoàn toàn vào standalone app để tránh conflict với autocomplete native của VS Code.

### Case-Sensitive
- **Preserves your writing style** - "Tôi" and "tôi" are treated as different words
- **Exact matches** - Suggestions match your original capitalization

### Persistent Storage
- **Auto-load corpus** - No need to re-import on restart
- **SQLite database** - Fast and reliable

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Accept suggestion |
| `Up/Down` | Navigate suggestions |
| `Enter` | Accept + newline + auto-capitalize |
| `Esc` | Dismiss suggestions |

### Smart Typing
| Key | Action |
|-----|--------|
| `Space` | Trigger normalize: fix spacing quanh dấu câu + capitalize đầu dòng/sau dấu chấm |
| `.` | Giữ native typing (không auto chèn ngay) |
| `,` | Giữ native typing (không auto chèn ngay) |
| `Enter` | Giữ native typing (capitalize sẽ áp dụng khi hoàn tất từ + Space) |

---

## 📁 Project Structure

```
writer/
├── main.py                    # Standalone app entry point
├── requirements.txt           # App dependencies
├── src/
│   ├── ui/                   # UI components
│   │   ├── text_editor.py    # Text editor with ghost text
│   │   ├── suggestion_dropdown.py # Dropdown list
│   │   └── dialogs.py        # Import corpus dialog
│   ├── core/                 # Core logic
│   │   ├── suggestion_engine.py  # Suggestion algorithm
│   │   ├── corpus_processor.py  # Text processing
│   │   └── cache_manager.py      # Caching
│   └── data/                 # Data layer
│       ├── database.py         # SQLite
│       └── dictionary.py        # Vietnamese dictionary
├── data/
│   ├── database.db           # User corpus database (auto-created)
│   └── vietnamese_dict.txt     # Dictionary
└── input/                    # Place corpus .txt files here
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Vietnamese Autocomplete Writer             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CustomTkinter UI                              │   │
│  │  - Text Editor                                 │   │
│  │  - Ghost text (top-1)                          │   │
│  │  - Dropdown list (top-5, dynamic width)        │   │
│  │  - Smart normalize on SPACE                    │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Suggestion Engine (in-process)                │   │
│  │  - Bigram frequency ranking                     │   │
│  │  - Dictionary fallback                          │   │
│  │  - Case-sensitive matching                      │   │
│  │  - Punctuation cleanup                          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SQLite Database                                │   │
│  │  - word_frequency                               │   │
│  │  - bigram_frequency                             │   │
│  │  - dictionary                                   │   │
│  │  - metadata                                     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Development

### Run Tests
```bash
pytest tests/ -v
```

### Database Location
Database is stored at `data/database.db` and persists between sessions.

### Clear Database
To reset and start fresh:
```bash
rm data/database.db
```

---

## 📋 Requirements

- Python 3.10+
- customtkinter
- SQLite (built-in)

---

## License

MIT
