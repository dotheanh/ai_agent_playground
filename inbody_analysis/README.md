# InBody Tracker 📊

Theo dõi và hiển thị dữ liệu đo InBody theo thời gian.

## Cấu trúc thư mục

```
inbody_analysis/
├── data/
│   ├── InBody-YYYYMMDD.csv    # File CSV từ máy đo InBody
│   └── data.json              # File JSON đã parse (tự động tạo)
├── parse_csv.py               # Script parse CSV → JSON
├── index.html                 # Giao diện web
└── README.md
```

## Cách sử dụng

### Bước 1: Thêm file CSV mới

Copy file CSV từ máy InBody vào thư mục `data/`:
```
data/InBody-20260407.csv
```

### Bước 2: Parse CSV thành JSON

Chạy script Python để chuyển đổi:
```bash
python parse_csv.py
```

Script sẽ:
- Tìm file CSV mới nhất trong `data/`
- Parse và lưu vào `data/data.json`

### Bước 3: Chạy web server

```bash
python -m http.server 8000
```

### Bước 4: Mở browser

Truy cập: **http://localhost:8000**

## Tính năng

- **Dashboard**: 8 chỉ số chính với so sánh lần đo trước
- **Biểu đồ**: Cân nặng, BMI, % mỡ, cơ xương, điểm InBody, nước
- **Bảng lịch sử**: Tất cả các lần đo

## Lưu ý

- Luôn chạy `python parse_csv.py` trước khi mở web
- File CSV phải có định dạng chuẩn từ máy InBody
