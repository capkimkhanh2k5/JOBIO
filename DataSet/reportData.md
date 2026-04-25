# BÁO CÁO ĐỐI SOÁT DỮ LIỆU (DATA AUDIT REPORT)

**Ngày thực hiện:** 25/04/2026
**Nguồn dữ liệu:** `DataSet/Data_Final/`
**Mục tiêu:** Kiểm tra tính tương thích với Django Models (Backend)

---

## 📊 Tổng quan kết quả
Bộ dữ liệu khớp khoảng **85-90%**. Cần xử lý chuẩn hóa dữ liệu (Data Cleaning) trước khi import để tránh lỗi IntegrityError hoặc ValidationError.

---

## 🔍 Chi tiết từng bảng quan trọng

### 1. Bảng Người dùng (`users.json`)
| Trường dữ liệu | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| `email`, `full_name` | ✅ Khớp | Đồng bộ hoàn toàn. |
| `first_name`, `last_name` | ⚠️ Thừa | Model hiện dùng `full_name`. Các trường này nên được loại bỏ. |
| `username` | ⚠️ Sai lệch | Model đã disable username. Dữ liệu JSON có thể gây nhầm lẫn nếu không xử lý. |
| `password` | ✅ Khớp | Định dạng pbkdf2_sha256 chuẩn Django. |

### 2. Bảng Việc làm (`jobs.json`)
| Trường dữ liệu | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| `title`, `description` | ✅ Khớp | Nội dung text ổn định. |
| `job_type` | ❌ Sai định dạng | JSON dùng `full_time` (gạch dưới). Model yêu cầu `full-time` (gạch nối). |
| `salary_type` | ❌ Sai định dạng | JSON dùng `gross`. Model yêu cầu `monthly`, `yearly`, `hourly` hoặc `project`. |
| `status` | ✅ Khớp | `published`, `draft`, `closed` khớp hoàn toàn. |

### 3. Bảng Giao dịch (`transactions.json`)
| Trường dữ liệu | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| `amount`, `currency` | ✅ Khớp | Định dạng Decimal và String khớp. |
| `status` | ❌ Sai định dạng | JSON dùng `SUCCESS`. Model yêu cầu `pending`, `completed`, `failed`. |
| `type` | ⚠️ Thừa | Trường `type` không có trong định nghĩa Model `Transaction` hiện tại. |
| `vnp_TransactionNo` | ❌ Sai Key | JSON dùng `vnp_transactionno` (viết thường). Model yêu cầu CamelCase `vnp_TransactionNo`. |

### 4. Bảng Công ty (`companies.json`)
| Trường dữ liệu | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| `company_name`, `tax_code` | ✅ Khớp | Khớp 100%. |
| `verification_status` | ✅ Khớp | Đồng bộ: `pending`, `verified`, `rejected`. |

---

## ⚠️ Cảnh báo Rủi ro
1. **Lỗi Validation**: Các enum/choices (status, type, job_type) bị sai định dạng sẽ khiến Database từ chối bản ghi.
2. **Lỗi Schema**: Các trường CamelCase trong Model VNPay bị viết thường trong JSON sẽ không thể lưu trữ.
3. **Lỗi Logic**: Việc gộp `first_name`/`last_name` vào `full_name` cần được script hóa để tránh mất dữ liệu tên người dùng.

---

## 💡 Đề xuất hành động
- [ ] Xây dựng script `pre_import_cleaner.py` để chuẩn hóa các trường Enum.
- [ ] Map lại các Key cho bảng Transactions (VNPay fields).
- [ ] Thực hiện import thử nghiệm (Dry Run) trên 10 bản ghi đầu tiên trước khi nạp toàn bộ.

---
