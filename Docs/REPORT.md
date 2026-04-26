# BÁO CÁO PHÂN TÍCH: TÁI CẤU TRÚC DANH MỤC "NGÀNH NGHỀ" (INDUSTRY) CHO NỀN TẢNG CHUYÊN IT

**Ngày tạo:** 26/04/2026
**Phạm vi:** Toàn bộ hệ thống (Database, Backend, Frontend)
**Vấn đề:** Nền tảng JOBIO được định vị là chuyên về tuyển dụng IT. Do đó, việc duy trì một danh mục phân loại theo "Ngành nghề" (Industry) ở quy mô vĩ mô (như: CNTT, Y tế, Kế toán, Xây dựng...) sẽ khiến toàn bộ dữ liệu bị dồn vào một giá trị duy nhất ("Công nghệ thông tin"). Điều này phá vỡ ý nghĩa của các bộ lọc tìm kiếm và biến các biểu đồ thống kê (Phân bổ công ty) thành 100% cho một hạng mục, gây lãng phí tài nguyên và trải nghiệm UI kém.

---

## 1. PHÂN TÍCH HIỆN TRẠNG (IMPACT ANALYSIS)

### 1.1. Tầng Database (DB)
Bảng `company_industries_industry` (`Industry`) đang đóng vai trò làm khóa ngoại (Foreign Key) cho nhiều thực thể quan trọng:
- **`Company.industry`**: Xác định công ty thuộc ngành nghề nào.
- **`Recruiter_Experience.industry`**: Ứng viên/Người tuyển dụng khai báo kinh nghiệm theo ngành.

Nếu xóa bỏ hoàn toàn bảng này, hệ thống sẽ yêu cầu thực hiện nhiều Database Migrations phức tạp, có nguy cơ ảnh hưởng dữ liệu đang tồn tại.

### 1.2. Tầng Backend (BE)
- **API `GET /api/analytics/industry-distribution/`**: Đang `GROUP BY` theo `industry__name`. Hiện tại biểu đồ sẽ gom 100% công ty vào một miếng bánh duy nhất.
- **API `GET /api/companies/`**: Cung cấp tham số filter `?industry_id=` để tìm công ty. Bộ lọc này sẽ trở nên dư thừa nếu công ty nào cũng là IT.
- **Master Data CRUD (`/api/industries/`)**: Cho phép Admin tạo thêm các ngành nghề mới, điều này mâu thuẫn với định hướng "Chỉ IT" của nền tảng.

### 1.3. Tầng Frontend (FE)
- **Trang Admin Analytics (`AdvancedAnalytics.tsx`, `AdminDashboard.tsx`)**: Biểu đồ Pie Chart "Phân bổ công ty theo ngành nghề" sẽ hiển thị một hình tròn đơn sắc.
- **Trang Admin Master Data (`MasterData.tsx`)**: Đang có riêng một tab "Ngành nghề".
- **Trang Danh sách công ty (`CompanySidebar.tsx`)**: Có bộ lọc theo ngành nghề bên tay trái.
- **Trang Chi tiết công ty (`CompanyDetailPage.tsx`) & Thẻ công ty (`CompanyCard`)**: Có các badges hiển thị tên ngành nghề.

---

## 2. ĐỀ XUẤT GIẢI PHÁP: REPURPOSE "INDUSTRY" -> "IT DOMAIN"

Thay vì đập bỏ cấu trúc hiện tại, giải pháp tối ưu và an toàn nhất là **"Thay đổi ngữ nghĩa" (Repurpose)**. Chúng ta sẽ chuyển đổi khái niệm `Ngành nghề` thành `Lĩnh vực hoạt động (IT Domain) / Mô hình công ty`.

Thay vì chứa các giá trị vĩ mô (CNTT, Y tế), bảng `Industry` sẽ được **Seed lại** bằng các giá trị vi mô trong nội bộ ngành IT, ví dụ:
1. **IT Product** (Làm sản phẩm)
2. **IT Outsourcing** (Gia công phần mềm)
3. **FinTech** (Công nghệ Tài chính)
4. **EdTech** (Công nghệ Giáo dục)
5. **E-commerce** (Thương mại điện tử)
6. **AI & Machine Learning** (Trí tuệ nhân tạo)
7. **Blockchain / Web3**

### Lợi ích của giải pháp này:
✅ **Zero Database Migrations:** Không cần thay đổi bất kỳ Schema hay Foreign Key nào.
✅ **Biểu đồ sống động:** Pie chart ở Admin Analytics sẽ tự động phân chia tỷ lệ phần trăm giữa các mô hình công ty (VD: 40% Outsourcing, 30% Product, 15% FinTech, v.v.), rất có giá trị kinh doanh.
✅ **Bộ lọc có ý nghĩa:** Ứng viên giờ đây có thể lọc công ty theo tiêu chí "Tôi muốn tìm các công ty làm Product" thay vì "Tìm công ty làm IT".

---

## 3. KẾ HOẠCH TRIỂN KHAI (ACTION PLAN)

Nếu được phê duyệt, dưới đây là các bước cần thực hiện để hoàn tất quá trình chuyển đổi này:

### Bước 1: Điều chỉnh Dữ liệu (Backend/DB)
- Viết 1 script (hoặc Django command) để xóa sạch các dữ liệu `Industry` cũ.
- Seed lại danh sách `Lĩnh vực hoạt động IT` (Domains) mới như đã đề xuất ở mục 2.
- Cập nhật lại các dữ liệu mẫu (Dummy/Seed data) của bảng `Company` để phân bổ ngẫu nhiên vào các IT Domains mới, giúp biểu đồ thống kê hiển thị số liệu thực tế.

### Bước 2: Điều chỉnh Ngôn ngữ hiển thị (Frontend)
Tiến hành đổi toàn bộ các Label/Tooltip trên UI liên quan đến từ khóa "Ngành nghề":
1. **`Admin Analytics`**: Đổi tiêu đề biểu đồ thành "Phân bổ công ty theo lĩnh vực IT".
2. **`Master Data`**: Đổi tên tab `Ngành nghề` thành `Lĩnh vực / IT Domain`.
3. **`Company List / Filters`**: Đổi nhãn bộ lọc tìm kiếm thành "Lĩnh vực hoạt động". Cập nhật các Placeholder input từ "Tìm ngành nghề" thành "Tìm lĩnh vực".
4. **Các Form tạo/sửa Công ty**: Đổi Label trường `Industry` thành `Mô hình / Lĩnh vực IT`.

### Bước 3: Kiểm thử
- Chạy toàn bộ luồng tạo công ty, chọn lĩnh vực mới.
- Kiểm tra trang Dashboard Analytics xem dữ liệu chia tỷ lệ đã chính xác chưa.
- Kiểm tra chức năng Lọc công ty ngoài trang chủ.
