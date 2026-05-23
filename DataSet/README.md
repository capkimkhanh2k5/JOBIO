# 📑 HƯỚNG DẪN KIỂM TOÁN & NẠP DỮ LIỆU DỰ ÁN JOBIO

**Trạng thái:** ✅ **HOÀN THÀNH & ĐÃ XÁC MINH**
**Tổng số lỗi đã sửa:** 99 lỗi (trên 7 file dữ liệu JSON)
**Tỷ lệ xác thực thành công:** 100% PASS

---

## 📂 CẤU TRÚC THƯ MỤC DỮ LIỆU

```
DataSet/
├── 📋 TÀI LIỆU HƯỚNG DẪN (Đọc trước)
│   ├── README.md                           ← Tài liệu hướng dẫn chung (Bạn đang ở đây)
│   ├── COMPREHENSIVE_DATA_AUDIT_REPORT.md  ← Báo cáo kiểm toán dữ liệu chi tiết
│   ├── DATA_FIX_SUMMARY.md                 ← Tóm tắt nhanh các lỗi và phương án sửa
│   ├── BEFORE_AFTER_COMPARISON.md          ← Bảng so sánh dữ liệu trước và sau khi sửa
│   └── reportData.md                       ← Báo cáo kiểm toán ban đầu
│
├── 🔧 SCRIPT TỰ ĐỘNG HÓA
│   ├── data_fixer.py                       ← Script sửa lỗi dữ liệu tự động
│   ├── data_validator.py                   ← Script kiểm tra tính hợp lệ dữ liệu JSON
│   ├── loadData.sh                         ← Script hợp nhất để reset DB & import dữ liệu
│   └── FIX_REPORT.txt                      ← Log chi tiết lịch sử sửa lỗi
│
└── 📊 THƯ MỤC DỮ LIỆU (JSON)
    ├── Data_Final/                         ← Thư mục chứa dữ liệu gốc (chưa sửa)
    │   └── *.json (60 files)
    │
    └── Data_Final_FIXED/ ✅                ← Thư mục chứa DỮ LIỆU SẠCH (dùng để import)
        ├── transactions.json               (Đã sửa 30 lỗi)
        ├── jobs.json                       (Đã sửa 24 lỗi)
        ├── recruiters.json                 (Đã sửa 15 lỗi)
        ├── interviews.json                 (Đã sửa 10 lỗi)
        ├── job_alerts.json                 (Đã sửa 10 lỗi)
        ├── company_subscriptions.json      (Đã sửa 5 lỗi)
        ├── reports.json                    (Đã sửa 5 lỗi)
        └── [56 file khác - được sao chép nguyên bản]
```

---

## 🎯 HƯỚNG DẪN NHANH (QUICK START)

Để nạp toàn bộ dữ liệu sạch đã được sửa đổi vào database của bạn một cách nhanh nhất, hãy thực hiện theo các bước sau:

### Bước 1: Di chuyển tới thư mục gốc dự án
```bash
cd /Users/capkimkhanh/Documents/DUT/JOBIO
```

### Bước 2: Cấp quyền thực thi cho script nạp dữ liệu (nếu chưa có)
```bash
chmod +x DataSet/loadData.sh
```

### Bước 3: Chạy script để nạp dữ liệu
> [!IMPORTANT]
> Script `loadData.sh` đã được cấu hình tối giản: **Không thực hiện sao lưu database cũ thành file sql** và **Không xuất file log dư thừa**, mục tiêu tập trung tối đa vào việc nạp dữ liệu trực tiếp và nhanh chóng.

```bash
./DataSet/loadData.sh
```

*Lưu ý: Hệ thống sẽ yêu cầu bạn xác nhận xóa dữ liệu cũ (gõ `yes`). Quá trình này sẽ dọn sạch các bảng hiện tại (ngoại trừ bảng migration) và import toàn bộ dữ liệu sạch từ thư mục `Data_Final_FIXED` theo đúng thứ tự ràng buộc khóa ngoại (Foreign Key).*

---

## 🔧 THÔNG TIN CÁC CÔNG CỤ TỰ ĐỘNG HÓA

### 1. `loadData.sh` (Script nạp dữ liệu chính)
* **Tính năng:**
  * Kiểm tra môi trường (Python, thư mục dữ liệu).
  * Kiểm tra tính duy nhất của Seed Data để tránh trùng lặp.
  * Làm sạch database cũ (sử dụng lệnh `flush` của Django hoặc `TRUNCATE CASCADE` trong SQL).
  * Chạy script Python `load_seed_data.py` để import dữ liệu sạch.
  * Tự động đồng bộ hóa PostgreSQL sequences để tránh lỗi trùng ID khi tạo mới dữ liệu sau này.
  * Hiển thị bảng thống kê dữ liệu sau khi nạp xong.
* **Tùy chọn:**
  * `--dry-run`: Mô phỏng quá trình nạp dữ liệu mà không ghi đè vào database thật.

### 2. `data_fixer.py` (Script sửa lỗi tự động)
* **Mục đích:** Quét qua dữ liệu thô ban đầu và tự động sửa các lỗi định dạng, enum, kiểu chữ.
* **Cách chạy (chỉ khi có dữ liệu thô mới):**
  ```bash
  python3 DataSet/data_fixer.py DataSet/Data_Final
  ```

### 3. `data_validator.py` (Script kiểm tra tính hợp lệ)
* **Mục đích:** Xác minh các tệp JSON đã tuân thủ hoàn toàn cấu hình Django Models.
* **Cách chạy:**
  ```bash
  python3 DataSet/data_validator.py DataSet/Data_Final_FIXED
  ```

---

## 📊 THỐNG KÊ LỖI ĐÃ SỬA (99 LỖI)

| Tên File JSON | Lỗi Trước Khi Sửa | Lỗi Sau Khi Sửa | Trạng Thế |
| :--- | :---: | :---: | :---: |
| `transactions.json` | 30 | 0 | ✅ Sạch |
| `jobs.json` | 24 | 0 | ✅ Sạch |
| `recruiters.json` | 15 | 0 | ✅ Sạch |
| `interviews.json` | 10 | 0 | ✅ Sạch |
| `job_alerts.json` | 10 | 0 | ✅ Sạch |
| `company_subscriptions.json` | 5 | 0 | ✅ Sạch |
| `reports.json` | 5 | 0 | ✅ Sạch |
| **TỔNG CỘNG** | **99** | **0** | **✅ 100% Hoàn hảo** |

---

## 🎓 CÁC LỖI THƯỜNG GẶP TRONG DỮ LIỆU GỐC

Trong quá trình kiểm toán dữ liệu gốc, chúng tôi đã phát hiện và xử lý các nhóm lỗi sau:
1. **Sai lệch kiểu chữ (Case Sensitivity):** Django enums phân biệt chữ hoa/thường rất nghiêm ngặt (Ví dụ: dữ liệu gốc ghi `SUCCESS`, Django yêu cầu `completed` hoặc dữ liệu gốc ghi `full_time` trong khi model yêu cầu `full-time`).
2. **Sai tên trường (CamelCase vs snake_case):** Một số tên trường trong file JSON không đồng nhất với Django Model (Ví dụ: `vnp_bankcode` sửa lại thành `vnp_BankCode`).
3. **Sai giá trị Enum:** Sử dụng các giá trị không nằm trong cấu hình lựa chọn của Django (Ví dụ: sửa đổi trạng thái nhà tuyển dụng từ `actively_looking` thành `active`).

---

## 📞 XỬ LÝ SỰ CỐ (TROUBLESHOOTING)

* **Lỗi khóa ngoại (Foreign Key Constraint) khi import thủ công:**
  * Giải pháp: Hãy sử dụng script `./DataSet/loadData.sh` vì nó đã được thiết lập thứ tự import dữ liệu chuẩn xác để không gây lỗi ràng buộc.
* **Lỗi trùng khóa chính (Primary Key/ID) khi tạo dữ liệu mới sau khi import:**
  * Giải pháp: Script `loadData.sh` có bước đồng bộ hóa sequence (`sync_sequences`). Hãy chắc chắn bạn chạy script này để sửa lại bộ đếm ID của PostgreSQL.
