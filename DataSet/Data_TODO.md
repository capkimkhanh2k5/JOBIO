## 1. 🗂️ Master Data / Dữ liệu danh mục (BẮT BUỘC cần có dữ liệu sẵn)

Đây là các bảng cấu hình, danh mục tham chiếu. Các dropdown chọn, bộ lọc filter sẽ đọc từ đây.

### 📍 Địa lý & Địa chỉ
- **`Province`** (`provinces`): Danh sách tỉnh/thành phố.
  - `province_name` (CharField): Tên tỉnh/thành phố [required]
  - `province_type` (CharField): Loại [required]
  - `region` (CharField): Vùng miền [required]
- **`Commune`** (`communes`): Danh sách quận/huyện/phường/xã.
  - `province` (FK -> Province): Tỉnh/Thành phố [required]
  - `commune_name` (CharField): Tên xã/phường [required]

### 🏢 Công ty & Ngành nghề
- **`Industry`** (`industries`): Chuyên ngành kinh doanh.
  - `name` (CharField): Tên ngành nghề [required]
  - `slug` (SlugField): Tên miền tĩnh [required]
  - `description` (TextField): Mô tả [null/blank]
  - `icon` (CharField): Biểu tượng [null/blank]
- **`MediaType`** (`media_types`): Loại hình media của công ty.
  - `name` (CharField): Loại media [required]
  - `slug` (SlugField): Tên miền tĩnh [required]
  - `description` (TextField): Mô tả [null/blank]
- **`BenefitCategory`** (`benefit_categories`): Hạng mục phúc lợi.
  - `name` (CharField): Tên phúc lợi [required]
  - `icon` (CharField): Biểu tượng [null/blank]
  - `description` (TextField): Mô tả [null/blank]

### 💼 Việc làm & Kỹ năng
- **`JobCategory`** (`job_categories`): Danh mục nghề nghiệp.
  - `name` (CharField): Tên danh mục [required]
  - `slug` (SlugField): Tên miền tĩnh [required]
  - `parent` (FK -> JobCategory): Danh mục cha [null/blank]
  - `icon` (CharField): Biểu tượng [null/blank]
  - `description` (TextField): Mô tả [null/blank]
- **`SkillCategory`** (`skill_categories`): Nhóm kỹ năng.
  - `name` (CharField): Tên danh mục kỹ năng [required]
  - `slug` (SlugField): Tên miền tĩnh [required]
  - `description` (TextField): Mô tả [null/blank]
- **`Skill`** (`skills`): Danh sách kỹ năng chi tiết.
  - `category` (FK -> SkillCategory): Danh mục [required]
  - `name` (CharField): Tên kỹ năng [required]
  - `slug` (SlugField): Tên miền tĩnh [required]
  - `description` (TextField): Mô tả [null/blank]
- **`Language`** (`languages`): Ngôn ngữ.
  - `name` (CharField): Tên ngôn ngữ [required]
  - `code` (CharField): Mã ngôn ngữ [required]

### 💳 Thanh toán & Gói cước
- **`SubscriptionPlan`** (`subscription_plans`): Các gói dịch vụ trả phí.
  - `name` (CharField): Tên gói [required]
  - `slug` (SlugField): Slug [required]
  - `price` (DecimalField): Giá [required]
  - `billing_cycle` (CharField): Chu kỳ thanh toán [required]
  - `features` (JSONField): Tính năng [required]
  - `job_post_limit` (IntegerField): Giới hạn tin tuyển dụng [null/blank]
  - `cv_view_limit` (IntegerField): Giới hạn xem CV [null/blank]
- **`PaymentMethod`** (`payment_methods`): Phương thức thanh toán.
  - `name` (CharField): Tên phương thức [required]
  - `code` (CharField): Mã [required]
  - `config` (JSONField): Cấu hình [null/blank]

### 🚀 Tuyển dụng (Jobs flow)
- **`Job`** (`jobs`): (Tin tuyển dụng)
  - `company` (FK -> Company): Công ty [required]
  - `title` (CharField): Tiêu đề [required]
  - `category` (FK -> JobCategory): Danh mục [null/blank]
  - `job_type` (CharField): Loại công việc [required]
  - `level` (CharField): Cấp bậc [required]
  - `experience_years_min` / `max` (IntegerField): Kinh nghiệm (năm) [requires/null]
  - `salary_min` / `max` (DecimalField): Mức lương [null/blank]
  - `number_of_positions` (IntegerField): Số lượng tuyển [required]
  - `description` / `requirements` / `benefits`: Mô tả, Yêu cầu, Quyền lợi [required/null]
  - `is_remote` (BooleanField): Làm việc từ xa [required]
  - `status` (CharField): Trạng thái [required]
- **`Application`** (`applications`): (Đơn ứng tuyển)
  - `job` (FK -> Job): Công việc [required]
  - `recruiter` (FK -> Recruiter): Ứng viên [required]
  - `status` (CharField): Trạng thái [required]
  - `applied_at` (DateTimeField): Ngày ứng tuyển [null/blank]
