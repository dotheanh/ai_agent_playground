# Godot MCP Setup Guide

Hướng dẫn cài đặt và chạy Godot MCP để kết nối Claude Code với Godot Editor.

---

## Yêu cầu

- Node.js v18+ ([nodejs.org](https://nodejs.org))
- Godot 4.x
- Claude Code đã cài đặt

---

## 1. Cài đặt lần đầu (One-time Setup)

### Bước 1: Cài đặt Godot MCP Server

Chạy lệnh sau trong PowerShell:

```powershell
irm https://gitlab.zingplay.com/gd/godot-mcp/-/raw/main/install.ps1 | iex
```

Script sẽ tự động:
1. Kiểm tra phiên bản Node.js
2. Tải và cài `godot-mcp-server` và `godot-mcp-connector`
3. Hỏi có muốn bật auto-start khi đăng nhập không
4. Nhập access token để kích hoạt

### Bước 2: Tải và cài đặt Plugin vào Project Godot

1. Tải plugin: [godot-mcp-addons-1.0.3.zip](http://27.0.15.113:8001/release/godot-mcp-addons-1.0.3.zip)
2. Extract zip file
3. Copy thư mục `godot-mcp` vào project:

```
gopoke2/
└── addons/
    └── godot-mcp/    ← Copy vào đây (KHÔNG phải godot-mcp-addons/addons!)
```

**Quan trọng:** Tên folder phải là `godot-mcp`, không phải `godot_mcp`.

### Bước 3: Bật Plugin trong Godot

1. Mở Godot Editor → Project → Project Settings
2. Chọn tab **Plugins**
3. Tìm **"Godot MCP"** và tick **Enable**
4. Thấy thông báo "MCP Pro" ở bottom panel là OK

### Bước 4: Kiểm tra MCP Server đã chạy

```bash
godot-mcp status
```

Nếu chưa chạy:
```bash
godot-mcp start
```

---

## 2. Chạy mỗi lần khởi động máy

### Tự động (nếu đã bật auto-start khi cài đặt)

- `godot-mcp-server` sẽ tự khởi động cùng Windows
- Chỉ cần mở Godot Editor là Claude Code sẽ kết nối được

### Thủ công (nếu chưa bật auto-start)

```bash
godot-mcp start
```

Sau đó mở Godot Editor lên là được.

---

## Kiểm tra kết nối

Trong Claude Code, chạy:

```
mcp__godot-editor__list_editors
```

Nếu thấy thông tin project (GoPoke v2) là đã kết nối thành công.

---

## Các lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `godot-mcp status` | Kiểm tra server đang chạy không |
| `godot-mcp start` | Khởi động server |
| `godot-mcp stop` | Dừng server |
| `godot-mcp logs` | Xem log server |
| `godot-mcp activate` | Nhập hoặc cập nhật token |

---

## Xử lý lỗi

**Server không phản hồi:**
```bash
godot-mcp logs
godot-mcp start
```

**Không thấy plugin trong Godot:**
- Kiểm tra đường dẫn: `project/addons/godot-mcp/plugin.cfg`
- Tên folder phải là `godot-mcp` (có dấu gạch ngang)

**Claude Code không kết nối được:**
- Đảm bảo Godot Editor đang mở với plugin enabled
- Kiểm tra server đang chạy: `godot-mcp status`

---

## Cấu hình trong .mcp.json

```json
{
  "mcpServers": {
    "godot-editor": {
      "command": "godot-mcp-connector"
    },
    "godot-docs": {
      "type": "http",
      "url": "http://27.0.15.113:8000/mcp"
    }
  }
}
```

---

## Tài liệu tham khảo

- Trang chủ: http://27.0.15.113:8001/
- Hướng dẫn: http://27.0.15.113:8001/godot-mcp.html