# BÁO CÁO PHÂN TÍCH & KẾ HOẠCH KIỂM TRA HỆ THỐNG QUẢN TRỊ (ADMIN PAGE)

**Dự án:** JOBIO - Nền tảng tuyển dụng IT
**Ngày lập:** 27/04/2026
**Phạm vi:** Phân tích đối chiếu giữa Database (DB) và Giao diện Quản trị (UI)

---

## 1. QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT)

### 1.1. Đối chiếu Database
*   **Bảng dữ liệu:** `users` (CustomUser)
*   **Các trường quan trọng:**
    *   `email` (Primary ID)
    *   `full_name`, `phone`
    *   `role` (admin, company, candidate)
    *   `status` (active, inactive, banned)
    *   `is_staff`, `is_superuser` (Quyền hệ thống)
    *   `email_verified` (Trạng thái xác thực)

### 1.2. Phân tích chức năng & Hiển thị UI
| Chức năng | Dữ liệu DB đối chiếu | Yêu cầu hiển thị & Thao tác UI |
| :--- | :--- | :--- |
| **Xem danh sách** | `email`, `role`, `status`, `created_at` | Hiển thị bảng có bộ lọc theo Role và Status. Cần có thanh tìm kiếm theo Email/Tên. |
| **Xem chi tiết** | Tất cả các trường + `last_login` | Hiển thị thông tin cá nhân đầy đủ. Đối với Company, cần link sang hồ sơ công ty. |
| **Chỉnh sửa** | `full_name`, `phone`, `role` | Cho phép Admin cập nhật thông tin sai lệch hoặc điều chỉnh quyền hạn (VD: Nâng cấp lên Staff). |
| **Cấm người dùng** | `status` -> `banned` | Nút "Cấm" phải yêu cầu xác nhận. Khi cấm, cần vô hiệu hóa khả năng đăng nhập và ẩn hồ sơ (nếu là ứng viên). |
| **Xác thực thủ công** | `email_verified` -> `true` | Hỗ trợ Admin xác thực nhanh cho các tài khoản gặp lỗi nhận mail. |

---

## 2. QUẢN LÝ BLOG (CMS)

### 2.1. Đối chiếu Database
*   **Bảng dữ liệu:** `blog_post`, `blog_category`, `blog_tag`
*   **Các trường quan trọng:** `title`, `slug`, `content`, `status` (draft, published), `author_id`.

### 2.2. Phân tích chức năng & Hiển thị UI
| Chức năng | Dữ liệu DB đối chiếu | Yêu cầu hiển thị & Thao tác UI |
| :--- | :--- | :--- |
| **Viết bài mới** | `title`, `content`, `category_id` | Bộ soạn thảo Rich Text (WYSIWYG). Cho phép upload ảnh bìa thông qua module `file_uploads`. |
| **Quản lý trạng thái** | `status` | Nút chuyển nhanh giữa Draft (Nháp) và Published (Công khai). |
| **Phân loại** | `blog_category` | Quản lý danh mục để gom nhóm bài viết (VD: Tin thị trường, Hướng dẫn CV). |

---

## 3. QUẢN LÝ CÔNG TY & DUYỆT HỒ SƠ (COMPANY MODERATION)

### 3.1. Đối chiếu Database
*   **Bảng dữ liệu:** `companies`
*   **Các trường quan trọng:** `company_name`, `tax_code`, `verification_status` (pending, verified, rejected).

### 3.2. Phân tích chức năng & Hiển thị UI
| Chức năng | Dữ liệu DB đối chiếu | Yêu cầu hiển thị & Thao tác UI |
| :--- | :--- | :--- |
| **Duyệt công ty** | `verification_status` | Hiển thị danh sách "Chờ duyệt". Admin xem giấy phép/MST và nhấn "Duyệt" hoặc "Từ chối". |
| **Đối chiếu logo** | `logo_url` | Kiểm tra tính hợp lệ của ảnh logo (không chứa nội dung nhạy cảm). |
| **Quản lý tin đăng** | `jobs` liên quan | Nếu công ty bị cấm, tất cả tin tuyển dụng liên quan phải chuyển về trạng thái ẩn. |

---

## 4. QUẢN LÝ GIAO DỊCH & DỊCH VỤ (BILLING)

### 4.1. Đối chiếu Database
*   **Bảng dữ liệu:** `transactions`, `company_subscriptions`
*   **Các trường quan trọng:** `amount`, `payment_method`, `status` (success, failed), `expiry_date`.

### 4.2. Phân tích chức năng & Hiển thị UI
*   **Tra cứu giao dịch:** Cho phép tìm kiếm theo mã giao dịch hoặc email công ty.
*   **Kiểm tra gói cước:** Xem công ty nào đang dùng gói Premium nào và khi nào hết hạn để hỗ trợ gia hạn.

---

## 5. BÁO CÁO VI PHẠM & HỖ TRỢ (REPORT SYSTEM)

### 5.1. Đối chiếu Database
*   **Bảng dữ liệu:** `system_reports`
*   **Các trường quan trọng:** `subject_type` (Job, Company, User), `reason`, `status` (open, resolved).

### 5.2. Phân tích chức năng & Hiển thị UI
*   **Xử lý khiếu nại:** Admin đọc lý do người dùng báo cáo vi phạm, sau đó đưa ra quyết định (Xóa tin vi phạm, Nhắc nhở, hoặc Khóa tài khoản).

---

## 6. DANH SÁCH CÁC ĐIỂM CẦN KIỂM TRA (CHECKLIST)

1.  **Tính nhất quán dữ liệu:** Khi xóa một User, dữ liệu liên quan (Jobs, Blogs) sẽ xử lý như thế nào? (CASCADE hay SET NULL).
2.  **Validation hiển thị:** Các trường dữ liệu trống trong DB (null) có được hiển thị thân thiện trên UI không (VD: hiện "-" thay vì để trống).
3.  **Bảo mật:** Đảm bảo chỉ User có `is_staff` hoặc `is_superuser` mới truy cập được các API này.
4.  **Hiệu năng:** Các trang danh sách (User, Job) đã có phân trang (Pagination) chưa? Tránh load hàng ngàn dòng cùng lúc.

---
**Người thực hiện phân tích:** AI Assistant (Antigravity)
**Trạng thái:** Chờ kiểm duyệt.

---

## 7. KẾT QUẢ RÀ SOÁT THỰC TẾ TRÊN CODEBASE (DB - API - UI)

### 7.1 User Management
*   **DB đối chiếu:** `users` có `email`, `full_name`, `phone`, `role`, `status`, `email_verified`, `last_login`, `is_staff`, `is_superuser`.
*   **API hiện có:**
    *   `GET /api/users/` (list + filter + search + pagination)
    *   `GET /api/users/stats/`
    *   `PATCH /api/users/:id/status/` (ban/active)
    *   `PATCH /api/users/:id/role/`
    *   `PATCH /api/users/:id/verify-email/` (đã bổ sung)
    *   `PATCH /api/users/:id/` (đã bổ sung hỗ trợ partial update)
*   **UI hiện có:**
    *   Danh sách + filter role/status + search + pagination.
    *   Drawer xem chi tiết user.
    *   Hành động khóa/kích hoạt.
    *   **Đã bổ sung:** modal sửa thông tin (`full_name`, `phone`, `role`, `email_verified`) + nút xác thực email thủ công.
*   **Rule nghiệp vụ đã triển khai thêm:** Khi khóa tài khoản công ty (`status=banned`), toàn bộ job đang `published` của công ty được chuyển sang `closed` để ẩn khỏi marketplace.

### 7.2 Blog Management
*   **DB đối chiếu:** `post`, `category`, `tag` với `title`, `slug`, `content`, `status`, `author_id`, `thumbnail`.
*   **API hiện có:** CRUD post/category/tag + `admin-stats`.
*   **UI hiện có:** danh sách bài viết, lọc status, quản lý category/tag, create/edit post.
*   **Đã bổ sung:** upload ảnh bìa trực tiếp trong form bài viết admin, preview ảnh và lưu `thumbnail`.

### 7.3 Company Moderation
*   **DB đối chiếu:** `companies` với `company_name`, `tax_code`, `verification_status`, `logo_url`.
*   **API hiện có:**
    *   `GET /api/companies/?verification_status=pending`
    *   `PATCH /api/companies/:id/verification/`
    *   `GET /api/companies/moderation-stats/`
*   **UI hiện có:** danh sách chờ duyệt, tìm kiếm, duyệt/từ chối.
*   **Đối chiếu yêu cầu:** đạt yêu cầu duyệt công ty; phần kiểm duyệt nội dung logo đang ở mức manual review qua UI.

### 7.4 Billing
*   **DB đối chiếu:** `transactions`, `company_subscriptions` với `amount`, `payment_method`, `status`, `end_date`.
*   **API hiện có:**
    *   `GET /api/billing/admin-finance/`
    *   `GET /api/billing/admin-finance/stats/`
    *   `GET /api/billing/admin-finance/export/`
    *   `GET /api/billing/admin-finance/subscriptions/` (đã bổ sung)
*   **UI hiện có:** bảng giao dịch + lọc/search/export.
*   **Đã bổ sung:** bảng theo dõi gói dịch vụ đang hoạt động theo công ty, gồm ngày bắt đầu, ngày hết hạn và số ngày còn lại.

### 7.5 Report System
*   **DB đối chiếu:** `reports` với `entity_type`, `entity_id`, `description`, `status`, `resolution_notes`.
*   **API hiện có:**
    *   `GET /api/reports/admin-reports/`
    *   `GET /api/reports/admin-reports/stats/`
    *   `PATCH /api/reports/admin-reports/:id/update_status/`
    *   `GET /api/reports/admin-reports/export/`
*   **UI hiện có:** danh sách báo cáo, lọc status, thao tác xử lý, export CSV.

---

## 8. GHI CHÚ BẢO MẬT & KIỂM SOÁT TRUY CẬP
*   Permission `IsAdmin` đã được mở rộng để chấp nhận `is_staff` hoặc `is_superuser` (ngoài `role=admin`) nhằm khớp tiêu chí bảo mật trong checklist.
*   Các endpoint admin của user/billing/reports/jobs đã dùng cơ chế admin permission trước khi truy cập dữ liệu nhạy cảm.

---

## 9. HẠNG MỤC CẦN TEST HỒI QUY SAU TRIỂN KHAI
1.  User admin edit: sửa tên/sđt/role/email_verified và reload danh sách.
2.  Ban company user: kiểm tra job public của công ty có chuyển `closed`.
3.  Billing subscriptions: phân trang + search theo company/email/plan + hiển thị ngày còn lại.
4.  Blog thumbnail upload: upload ảnh, preview, lưu và hiển thị lại khi edit bài.
5.  Permission admin: tài khoản `is_staff=true` nhưng role khác `admin` vẫn truy cập được API admin theo đúng policy.
