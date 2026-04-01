# Claude Buddy Reroll - External Tool Analysis

## Overview

Repo: `claude-buddy-reroll-main` (tải từ GitHub: https://github.com/RoggeOhta/claude-buddy-reroll)

**Đây là công cụ hỗ trợ người dùng đăng nhập bằng tài khoản Claude (OAuth)**

---

## So sánh 2 công cụ

| Feature | buddy-reroll-web.html (của anh) | claude-buddy-reroll-main |
|---------|----------------------------------|--------------------------|
| **Đối tượng** | API key users | OAuth/Claude account users |
| **Cơ chế** | Thay đổi userID trong config | Patch binary + thay đổi salt |
| **Yêu cầu** | API key | Claude Code đã login (credentials.json) |
| **Platform** | Web browser (HTML/JS) | Bun + CLI |
| **Rủi ro** | Thấp | Cao (ToS violation) |

---

## Cách hoạt động của claude-buddy-reroll

### Nguyên lý

Claude Code tạo buddy theo công thức:
```
hash(account_uuid + salt) → seed → mulberry32 PRNG → rarity / species / eyes / hat / shiny
```

Với:
- **account_uuid**: Lấy từ `~/.claude/.credentials.json` → gọi API OAuth để lấy UUID
- **salt**: String cố định trong binary (hiện tại: `friend-2026-401`)

### Các bước thực hiện

1. **Đọc account UUID**: Parse `~/.claude/.credentials.json` → lấy OAuth token → gọi API `https://api.anthropic.com/api/oauth/profile` → lấy UUID

2. **Detect salt hiện tại**: Đọc binary Claude Code tại `~/.local/bin/claude` → tìm pattern `friend-XXXX-XXX`

3. **Brute-force salt**: Thử hàng triệu salt khác nhau, filter theo tiêu chí (rarity, species, shiny...)

4. **Patch binary**: Thay thế salt cũ bằng salt mới trong binary (cùng độ dài, cùng encoding)

5. **Clear companion state**: Xóa field `companion` trong `~/.claude/.config.json` để buộc tạo buddy mới

---

## Cách sử dụng

### Cài đặt
```bash
git clone https://github.com/RoggeOhta/claude-buddy-reroll.git
cd claude-buddy-reroll
```

### Chạy interactive (tìm + chọn + patch)
```bash
bun buddy-reroll.ts
```

### Các flags
| Command | Description |
|---------|-------------|
| `--search` | Chỉ tìm kiếm, không patch |
| `--current` | Hiển thị buddy hiện tại |
| `--restore` | Khôi phục binary gốc |
| `--rarity <r>` | Lọc theo rarity (common/uncommon/rare/epic/legendary) |
| `--species <s>` | Lọc theo species |
| `--shiny` | Chỉ hiển thị shiny |
| `--limit <n>` | Số kết quả tối đa (default: 15) |

### Ví dụ
```bash
# Tìm legendary dragon
bun buddy-reroll.ts --species dragon --rarity legendary

# Tìm shiny bất kỳ
bun buddy-reroll.ts --shiny
```

---

## Verify: Có hoạt động không?

### Về mặt kỹ thuật: CÓ

Tool này **có thể hoạt động** với người dùng đăng nhập bằng Claude account vì:

1. **Đọc được UUID**: Gọi API OAuth với token từ `~/.claude/.credentials.json`
2. **Tìm được salt trong binary**: Regex pattern `friend-\d{4}-\w{3}`
3. **Patch được binary**: Thay thế salt string trong binary (cùng độ dài)
4. **Clear được companion state**: Xóa `companion` trong config

### Tuy nhiên có RỦI RO lớn:

| Rủi ro | Chi tiết |
|--------|----------|
| **Vi phạm ToS** | Reverse engineering + binary patching có thể bị coi là vi phạm Terms of Service |
| **Bị phát hiện** | API `buddy_react` gửi buddy info lên server - có thể phát hiện mismatch |
| **Binary integrity** | Claude Code tương lai có thể kiểm tra checksum |
| **Mất quyền truy cập** | Account bị suspend nếu bị phát hiện |

---

## Kết luận

- **buddy-reroll-web.html**: Dùng cho API key users - an toàn, chỉ thay đổi config
- **claude-buddy-reroll-main**: Dùng cho OAuth users - hoạt động được nhưng có rủi ro cao

Nếu anh dùng **API key**, tiếp tục dùng **buddy-reroll-web.html** là đủ.

Nếu anh dùng **Claude account (login)**, claude-buddy-reroll-main có thể dùng được nhưng cần cân nhắc rủi ro về ToS.