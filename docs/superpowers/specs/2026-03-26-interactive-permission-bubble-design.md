# Interactive Permission Bubble Design

## 1. Mục tiêu

Tăng tương tác bubble cho Desktop Pet theo yêu cầu:
- Luôn hiển thị option lựa chọn cho mọi `PermissionRequest`
- Option bấm được, gửi approve/deny/allow-all về flow Claude
- Nếu user approve/deny trực tiếp trong Claude UI thì bubble tự ẩn tương ứng

Scope chỉ tập trung permission flow. Không mở rộng sang feature ngoài permission.

---

## 2. Quyết định thiết kế

Chọn kiến trúc **Permission Broker qua local HTTP callback**.

Lý do:
- Hỗ trợ control 2 chiều (hook -> bubble, bubble -> decision)
- Dễ debug, trace theo request ID
- Tách trách nhiệm rõ giữa render UI và điều phối permission state

Không chọn:
- File queue/polling: dễ race, khó cleanup
- UI automation (send key/mouse): không ổn định, rủi ro bấm nhầm

---

## 3. Kiến trúc thành phần

1. **Claude Hook Script** (`desktop_pet/src/scripts/claude-hooks.js`)
   - Nhận payload từ `hooks.PermissionRequest`
   - Chuẩn hóa event (`permission_request`, `ask_question`)
   - Tạo `requestId`, normalize message/options
   - Gửi vào Broker endpoint nội bộ

2. **Permission Broker** (mới, trong main process)
   - Nhận permission request
   - Quản lý `pendingRequests` theo `requestId`
   - Dispatch hiển thị bubble active
   - Nhận decision từ bubble và resolve đúng request
   - Nhận event resolved từ Claude UI để auto-hide bubble

3. **Bubble Window UI** (`desktop_pet/src/main/bubble-window.js`)
   - Render message + options dạng button click được
   - Click option gọi endpoint decision
   - Disable nút khi đang gửi để chống double submit

4. **HTTP Gateway** (`desktop_pet/src/main/http-server.js`)
   - Expose API nội bộ cho hook + bubble
   - Route request vào broker

---

## 4. Data flow

### 4.1 Claude xin quyền
1. Claude emit `PermissionRequest`
2. Hook script parse stdin payload -> normalize -> `POST /hook/permission-request`
3. Broker tạo pending request (hoặc update nếu trùng id)
4. Broker show bubble cho request active

### 4.2 User bấm trong bubble
1. Bubble click option -> `POST /bubble/decision`
2. Broker validate request pending
3. Broker resolve request theo decision mapping
4. Broker mark resolved + hide bubble
5. Broker chuyển sang request kế tiếp trong queue (nếu có)

### 4.3 User bấm trực tiếp trong Claude UI
1. Hook nhận event resolved (cùng requestId)
2. Hook gửi `POST /hook/permission-resolved`
3. Broker clear pending tương ứng
4. Nếu bubble đang hiển thị request đó -> hide ngay

---

## 5. API contract

### `POST /hook/permission-request`
```json
{
  "requestId": "req_abc123",
  "type": "permission_request",
  "message": "Run: powershell -Command \"Get-Date\"",
  "toolName": "Bash",
  "options": ["Yes", "Yes, allow for all projects", "No"],
  "raw": {}
}
```
Response:
```json
{ "status": "queued" }
```

### `POST /bubble/decision`
```json
{
  "requestId": "req_abc123",
  "decision": "approve_once"
}
```
`decision` enum:
- `approve_once`
- `approve_always`
- `deny`

Response:
```json
{ "status": "resolved" }
```

### `POST /hook/permission-resolved`
```json
{
  "requestId": "req_abc123",
  "resolvedBy": "claude_ui"
}
```
Response:
```json
{ "status": "cleared" }
```

---

## 6. Option mapping

Text -> decision chuẩn hóa:
- chứa `allow for all` -> `approve_always`
- chứa `yes` hoặc `approve` -> `approve_once`
- chứa `no` hoặc `deny` -> `deny`

Nếu payload thiếu options, luôn fallback:
1. `Yes`
2. `Yes, allow for all projects`
3. `No`

---

## 7. State model và reliability

`pendingRequests: Map<requestId, PendingRequest>`

`PendingRequest`:
- `requestId`
- `createdAt`
- `status` (`pending|resolved|expired`)
- `message`
- `options`
- `toolName`
- `source` (`bubble_click|claude_ui`)

Rules:
- Timeout 60s -> `expired`, hide bubble nếu active
- Duplicate same `requestId` -> update payload, không tạo item mới
- Resolve lặp lại -> idempotent (`already_resolved`)
- FIFO queue: chỉ 1 bubble active tại 1 thời điểm

---

## 8. Error handling

- Bubble decision endpoint fail:
  - UI hiện trạng thái retry
  - re-enable buttons
- Request không tồn tại khi decision tới:
  - trả `404 request_not_found`
  - bubble hide để tránh trạng thái mồ côi
- App restart khi pending chưa resolve:
  - clear state in-memory
  - request mới sẽ vào lại từ hook lần tiếp theo

---

## 9. Test plan

1. **Fallback options**: trigger Edit permission -> bubble luôn có 3 option
2. **Bubble approve**: click `Yes` -> action Claude tiếp tục, bubble hide
3. **Bubble deny**: click `No` -> action Claude bị deny, bubble hide
4. **Approve from Claude UI**: không click bubble, bấm trong Claude -> bubble hide đúng request
5. **Queue**: trigger nhiều request liên tiếp -> hiển thị FIFO, không overlap
6. **Timeout**: không tương tác 60s -> request expired + bubble hide

---

## 10. Tác động file

Sửa:
- `desktop_pet/src/scripts/claude-hooks.js`
- `desktop_pet/src/main/http-server.js`
- `desktop_pet/src/main/bubble-window.js`
- `desktop_pet/src/main/main.js`
- `desktop_pet/scripts/setup-claude-hooks.js` (nếu cần thêm hook resolved)

Không tạo docs ngoài `docs/superpowers/specs`.

---

## 11. Success criteria

- Bubble luôn có options cho mọi permission request
- Option click thật sự resolve request Claude đúng approve/deny/allow-all
- Resolve ở Claude UI làm bubble hide đúng request
- Không còn race render / duplicate resolve
- Log debug đủ để truy vết theo `requestId`

---

## 12. Unresolved questions

1. Hook payload hiện tại có luôn cung cấp `requestId` ổn định cho toàn bộ event lifecycle không, hay cần tự sinh deterministic ID từ payload hash?
2. Claude side có emit event resolved riêng biệt đủ dữ liệu để map ngược requestId trong mọi trường hợp không?
