# Workshop 3 - Agentic Loop

> **Extend từ Workshop 2.** Copy workshop2.html, đổi tên thành workshop3.html, rồi thêm tính năng bên dưới.

- Page title (`<title>`): **Workshop 3 - Agentic Loop**

## Concept
User chat bình thường, nhưng khi LLM gọi tool, nó tự lặp (loop) — gọi tools nhiều lần liên tiếp — cho đến khi hoàn thành mà không cần user can thiệp.

## Thay đổi so với Workshop 2

### UI: Giữ nguyên chat input của Workshop 2
- Không thay đổi gì ở phần input

### Agentic Loop Logic
- Sau khi nhận `tool_calls`, tự động thực thi tool rồi gọi lại LLM — **không cần user bấm gì**
- Lặp cho đến khi LLM trả về response bình thường (không còn `tool_calls`)
- Giới hạn tối đa **10 vòng lặp**, hiển thị warning nếu bị cắt ngang

### Timeline View
- Hiển thị toàn bộ các bước theo dạng **timeline dọc**:
  ```
  🤔 Thinking...
  🔧 Tool call: get_weather({ city: "Ho Chi Minh City", days: 3 })
  📥 Tool result: { day1: 34°C, day2: 33°C, day3: 35°C }
  🤔 Thinking...
  🔧 Tool call: calculate({ expression: "(34 + 33 + 35) / 3" })
  📥 Tool result: 34
  🤔 Thinking...
  🔧 Tool call: remember_note({ content: "Nhiệt độ TB TP.HCM 3 ngày tới: 34°C" })
  📥 Tool result: "Đã lưu"
  ✅ Done: Nhiệt độ trung bình TP.HCM 3 ngày tới là 34°C. Đã lưu vào note.
  ```
- Mỗi bước hiện ra **dần dần** theo thời gian thực (không hiện tất cả cùng lúc)

### Tools
Giữ nguyên toàn bộ tools từ workshop 2, **không thêm, không bớt, không đổi tên**:
- `get_current_time`
- `calculate`
- `get_weather`
- `remember_note`
- `recall_notes`

Checkbox bật/tắt tools vẫn giữ nguyên như workshop 2.

### Ví dụ task mẫu (hardcode làm placeholder)
```
Tìm thời tiết TP.HCM 3 ngày tới, tính nhiệt độ trung bình, lưu kết quả vào note.
```

### Raw Request Panel
- Vẫn giữ nguyên
