# 📚 HƯỚNG DẪN SỬ DỤNG - SPEND TRACKER

## 🎯 MỤC ĐÍCH
Quản lý chi tiêu nhóm du lịch - **ĐƠN GIẢN NHẤT!**

---

## 📊 CẤU TRÚC FILE

**1 sheet duy nhất: CHI_TIÊU**

| Cột | Mô tả |
|-----|-------|
| A | Nội dung chi |
| B | Số tiền chi |
| C | Người chi |
| D-J | Các thành viên (TRUE/FALSE/Số) |
| K | Count (số người TRUE) |
| L | Share (tiền mỗi người) |

Dưới cùng: **Bảng tổng kết** mỗi người

---

## 🎯 CÁCH NHẬP LIỆU

### 3 Cách phân chia:

| Giá trị | Ý nghĩa |
|---------|---------|
| **TRUE** | Tham gia, chia đều phần còn lại |
| **FALSE** | Không tham gia |
| **Nhập số** | Custom amount (ví dụ: 300000) |

### Công thức tự động:

```
Share = (Tổng chi phí - Tổng các ô nhập số) / Số người TRUE
```

---

## 💡 VÍ DỤ

### Ví dụ 1: Chia đều 7 người
```
Nội dung: Đặt homestay | Số tiền: 2,400,000 | Người chi: Vy
Bình: TRUE | Nhi: TRUE | Tân: TRUE | Thuận: TRUE | Triển: TRUE | Thế Anh: TRUE | Vy: TRUE
→ Count: 7
→ Share: 2,400,000 / 7 = 342,857đ/người
```

### Ví dụ 2: Custom + Chia đều
```
Nội dung: Ăn tối | Số tiền: 1,000,000 | Người chi: Vy
Bình: 300,000 | Nhi: 200,000 | Tân: TRUE | Thuận: TRUE | Triển: TRUE | Thế Anh: FALSE | Vy: FALSE
→ Count: 3 (Tân, Thuận, Triển)
→ Phần còn lại: 1,000,000 - 300,000 - 200,000 = 500,000
→ Share: 500,000 / 3 = 166,667đ (Tân, Thuận, Triển mỗi người)
```

---

## 📈 BẢNG TỔNG KẾT (Dưới cùng)

| Thành viên | Đã chi/ứng | Phải trả (share) | NET | Trạng thái |
|------------|------------|------------------|-----|------------|
| Bình | 0 | 620,128 | -620,128 | ❌ Đang nợ |
| Vy | 4,200,000 | 3,279,872 | +920,128 | ✅ Quỹ nợ |

**NET = Đã chi/ứng - Phải trả**
- `NET > 0`: ✅ Quỹ nợ thành viên (được nhận tiền lại)
- `NET < 0`: ❌ Thành viên nợ quỹ (phải đóng thêm)

---

## ⚡ NHANH GỌN

1. Nhập nội dung, số tiền, người chi
2. Đánh TRUE cho người tham gia, FALSE cho người không
3. Hoặc nhập số cụ thể nếu muốn custom
4. **Tự động tính** Count và Share!
5. Xem tổng kết ở dưới cùng

---

**Đơn giản vậy thôi! 🎉**
