# Workshop 2 - Tool Calling

> **Extend từ Workshop 1.** Copy workshop1.html, đổi tên thành workshop2.html, rồi thêm tính năng bên dưới.

- Page title (`<title>`): **Workshop 2 - Tool Calling**

## Thay đổi so với Workshop 1

### Thêm: Tool Calling (1 round duy nhất, KHÔNG loop)
- Gửi thêm trường `tools` trong request payload theo chuẩn OpenAI function calling
- Khi LLM trả về `tool_calls`, thực hiện **đúng 1 round**:
  1. Hiển thị tool call lên UI (tên tool + arguments)
  2. Thực thi tool và lấy kết quả
  3. Gửi `tool` message vào history rồi gọi lại LLM **1 lần nữa** để lấy response cuối
  4. Hiển thị kết quả cuối cùng từ LLM
- **Quan trọng**: Lần gọi LLM thứ 2 **không gửi trường `tools`** trong payload để ép LLM trả về text response (tránh LLM tiếp tục gọi tool). Workshop này chỉ demo 1 lượt tool execution.
- Việc loop nhiều lần (agentic loop) sẽ được giới thiệu ở **Workshop 3**.

### Danh sách tools cơ bản (hardcode, implement sẵn trong JS)

- Hiển thị danh sách tools dạng **checkbox list** ở đầu trang (dưới system prompt)
- User có thể **bật/tắt từng tool** bằng checkbox
- Chỉ các tool đang **được check** mới được đưa vào trường `tools` của request payload
- Mặc định: tất cả tools đều được bật

| Tool | Mô tả |
|------|-------|
| `get_current_time` | Trả về ngày giờ hiện tại của máy |
| `calculate` | Tính toán biểu thức toán học đơn giản (ví dụ: `2 + 2 * 3`) |
| `get_weather` | Lấy dự báo thời tiết thật qua [Open-Meteo](https://api.open-meteo.com) (free, không cần API key) — geocode tên thành phố → tọa độ, rồi lấy nhiệt độ max/min theo từng ngày. Input: `city`, `days` (mặc định 1) |
| `remember_note` | Lưu 1 ghi chú vào bộ nhớ trong phiên (in-memory) |
| `recall_notes` | Đọc lại toàn bộ ghi chú đã lưu trong phiên |

### Hiển thị trong UI
- Mỗi tool call hiển thị dạng **expandable block** (có thể mở/đóng):
  - Tên tool + icon
  - Arguments (JSON)
  - Kết quả trả về

### Raw Request Panel
- Vẫn giữ nguyên, lúc này hiển thị thêm trường `tools` trong payload
