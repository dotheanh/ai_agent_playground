# Cha Của A* - Hoàng Tử Lý Tưởng

---

## 1. Thông Tin Cơ Bản

| Tiêu chí | Thông tin |
|----------|-----------|
| **Họ tên** | [Cần bổ sung tên] |
| **Vai trò** | Supporting |
| **Giới tính** | Nam |
| **Tuổi** | Hàng ngàn năm (sống trong Đô) |
| **Tình trạng** | Con của Hoàng đế thứ 12, CHA CỦA A* |
| **Nghề nghiệp** | Hoàng tử (đã từ bỏ quyền thừa kế) |
| **Tình trạng hôn nhân** | Đã có con với người phụ nữ loài người |

---

## 2. Ngoại Hình

> Cần bổ sung - là người Đô, cao khoảng 2M, không bị lão hóa vì sống trong Đô

---

## 3. Tính Cách

### Cốt lõi
- Chính nghĩa
- Nhân đạo
- Hòa bình
- Tự do
- Lý tưởng

### Điểm mạnh
- Đạo đức cao
- Quan tâm nhân loại
- Quyết đoán trong lựa chọn

### Điểm yếu
- Quá lý tưởng hóa
- Thất bại trong việc thay đổi Đô

### Giá trị
- Tự do
- Bình đẳng
- Hòa bình
- Nhân quyền

### Giới đạo đức
- Không bao giờ ăn thịt người
- Bảo vệ kẻ yếu

---

## 4. Tiểu Sử

### Chủ nghĩa
> Đi theo **CHỦ NGHĨA TỰ DO, BÌNH ĐẲNG và HÒA BÌNH** - TRÁI NGƯỢC hoàn toàn với văn hóa Đô

### Từ chối thừa kế

| Hành động | Lý do |
|-----------|-------|
| **TỪ CHỐI** thực hiện Lễ Chiến Đấu với cha mình (Hoàng đế) để được truyền ngôi | Ông không muốn trở thành hoàng đế theo cách bạo lực truyền thống |
| **THAY VÀO ĐÓ**, ông đứng về phía LOÀI NGƯỜI để chống lại Hoàng đế | - |

**Ghi chú**: Đây là hành động **CHÁNH TRỊ** và đạo đức **HIẾM CÓ** trong lịch sử Đô

---

## 5. Mối Quan Hệ Với Con: A*

### Tình trạng
- **Loại**: cha
- **Con ID**: a_star

### Mô tả
- Cha của A* - truyền cảm hứng cho A* nhưng A* chọn con đường khác

### Ảnh hưởng
- Có thể xem là 'phiên bản lý tưởng' mà A* muốn trở thành nhưng không thể

### di sản
- A* kế thừa lý tưởng bảo vệ nhân loại nhưng chọn phương pháp độc tài thay vì hòa bình

---

## 6. Mối Quan Hệ Với Cha: Hoàng Đế

### Tình trạng
- **Loại**: con_chong_cha

### Mô tả
- Con của Hoàng đế - đứng về phía nhân loại chống lại cha mình

### Ghi chú
- Mối quan hệ bị phá vỡ hoàn toàn

---

## 7. Tư Tưởng

### Mô tả
- Theo chủ nghĩa **TỰ DO, BÌNH ĐẲNG và HÒA BÌNH** - TRÁI NGƯỢC văn hóa Đô

### So sánh

| Đối tượng | So sánh |
|-----------|---------|
| **Against A*** | A* tuân theo quy tắc 'kẻ mạnh lãnh đạo' của Đô, còn cha A* phủ nhận hoàn toàn |
| **Against Grandfather** | Ông nội bóc lột và ăn thịt người, còn cha A* bảo vệ nhân loại |

### Đánh giá
- Có thể xem là **NGƯỜI LÝ TƯỞNG NHẤT** trong câu chuyện - nhưng sự lý tưởng hóa này cũng là điểm yếu

---

## 8. Cờ Truyện (Story Flags)

```javascript
{
  isIdealist: true,             // Là người lý tưởng
  isAlive: true,                // Vẫn sống
  fateToBeRevealed: "Số phận sau khi đứng về nhân loại sẽ được phát triển trong phần nội dung tới",
  isFatherOfAStar: true         // Là cha của A*
}
```

---

## 9. Tài Liệu Tham Khảo

- A*: `data/characters/a-star.md`
- Ông nội (Hoàng đế): `data/characters/hoang-de-lam-thoi.md`
- Đế quốc Đô: `data/world-building/do-quoc.md`
