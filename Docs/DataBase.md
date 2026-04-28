# Cấu trúc Cơ sở dữ liệu

## Module: Core_Users

### Bảng: `users` (Model: `CustomUser`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `password` | CharField |  | Password |
| `last_login` | DateTimeField | Null, Blank | Last login |
| `is_superuser` | BooleanField |  | Superuser status |
| `first_name` | CharField | Blank | First name |
| `last_name` | CharField | Blank | Last name |
| `is_staff` | BooleanField |  | Staff status |
| `is_active` | BooleanField |  | Active |
| `date_joined` | DateTimeField |  | Date joined |
| `email` | CharField | Unique | Email |
| `full_name` | CharField |  | Họ và tên |
| `phone` | CharField | Null, Blank | Số điện thoại |
| `avatar_url` | CharField | Null, Blank | Url ảnh đại diện |
| `role` | CharField |  | Vai trò |
| `status` | CharField |  | Trạng thái |
| `email_verified` | BooleanField |  | Email đã xác minh |
| `email_verification_token` | CharField | Null, Blank | Token xác minh email |
| `password_reset_token` | CharField | Null, Blank | Token reset mật khẩu |
| `password_reset_expires` | DateTimeField | Null, Blank | Hạn reset mật khẩu |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |
| `two_factor_enabled` | BooleanField |  | Kích hoạt 2fa |
| `two_factor_secret` | CharField | Null, Blank | Mã bí mật 2fa |
| `social_provider` | CharField | Blank | Nhà cung cấp social |
| `social_id` | CharField | Unique, Null, Blank | Id từ social provider |
| `groups` | ManyToManyField | Blank, FK -> Group | Groups |
| `user_permissions` | ManyToManyField | Blank, FK -> Permission | User permissions |

### Bảng: `user_passkeys` (Model: `UserPasskey`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `user` | ForeignKey | FK -> CustomUser | Người dùng |
| `credential_id` | BinaryField | Unique | Credential id |
| `public_key` | BinaryField |  | Public key |
| `sign_count` | PositiveIntegerField |  | Sign count |
| `device_name` | CharField |  | Tên thiết bị |
| `aaguid` | CharField | Blank | Aaguid |
| `transports` | JSONField | Blank | Transports |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `last_used_at` | DateTimeField | Null, Blank | Lần sử dụng cuối |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Geography_Provinces

### Bảng: `provinces` (Model: `Province`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `province_name` | CharField |  | Tên tỉnh/thành phố |
| `province_type` | CharField |  | Loại |
| `region` | CharField |  | Vùng miền |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Geography_Communes

### Bảng: `communes` (Model: `Commune`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `province` | ForeignKey | FK -> Province | Tỉnh/thành phố |
| `commune_name` | CharField |  | Tên xã/phường |
| `commune_type` | CharField |  | Loại |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Geography_Addresses

### Bảng: `addresses` (Model: `Address`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `address_line` | CharField |  | Số nhà, tên đường |
| `commune` | ForeignKey | Null, Blank, FK -> Commune | Xã/phường |
| `province` | ForeignKey | FK -> Province | Tỉnh/thành phố |
| `latitude` | DecimalField | Null, Blank | Vĩ độ |
| `longitude` | DecimalField | Null, Blank | Kinh độ |
| `is_verified` | BooleanField |  | Đã xác minh |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Company_Companies

### Bảng: `companies` (Model: `Company`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `user` | OneToOneField | Unique, Null, Blank, FK -> CustomUser | Tài khoản |
| `company_name` | CharField |  | Tên công ty |
| `slug` | SlugField | Unique | Slug |
| `tax_code` | CharField | Unique, Null, Blank | Mã số thuế |
| `company_size` | CharField | Null, Blank | Quy mô công ty |
| `industry` | ForeignKey | Null, Blank, FK -> Industry | Ngành nghề |
| `website` | CharField | Null, Blank | Website |
| `email` | CharField | Null, Blank | Email liên hệ |
| `phone` | CharField | Null, Blank | Số điện thoại |
| `logo_url` | CharField | Null, Blank | Url logo |
| `banner_url` | CharField | Null, Blank | Url banner |
| `description` | TextField | Null, Blank | Mô tả |
| `address` | ForeignKey | Null, Blank, FK -> Address | Địa chỉ |
| `headquarters` | CharField | Null, Blank | Trụ sở chính |
| `founded_year` | IntegerField | Null, Blank | Năm thành lập |
| `verification_status` | CharField |  | Trạng thái xác minh |
| `verified_at` | DateTimeField | Null, Blank | Thời gian xác minh |
| `verified_by` | ForeignKey | Null, Blank, FK -> CustomUser | Người xác minh |
| `follower_count` | IntegerField |  | Số người theo dõi |
| `job_count` | IntegerField |  | Số việc làm |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Company_Industries

### Bảng: `industries` (Model: `Industry`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField |  | Tên ngành nghề |
| `slug` | SlugField | Unique | Slug |
| `description` | TextField | Null, Blank | Mô tả |
| `icon_url` | CharField | Null, Blank | Url icon |
| `parent` | ForeignKey | Null, Blank, FK -> Industry | Ngành cha |
| `is_active` | BooleanField |  | Đang hoạt động |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Company_Benefit_Categories

### Bảng: `benefit_categories` (Model: `BenefitCategory`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField |  | Tên danh mục |
| `slug` | SlugField | Unique | Slug |
| `description` | TextField | Null, Blank | Mô tả |
| `icon_url` | CharField | Null, Blank | Url icon |
| `is_active` | BooleanField |  | Đang hoạt động |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Company_Company_Benefits

### Bảng: `company_benefits` (Model: `CompanyBenefit`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `company` | ForeignKey | FK -> Company | Công ty |
| `category` | ForeignKey | FK -> BenefitCategory | Danh mục |
| `benefit_name` | CharField |  | Tên phúc lợi |
| `description` | TextField | Null, Blank | Mô tả |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Company_Media_Types

### Bảng: `media_types` (Model: `MediaType`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `type_name` | CharField | Unique | Tên loại media |
| `description` | TextField | Null, Blank | Mô tả |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Company_Company_Media

### Bảng: `company_media` (Model: `CompanyMedia`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `company` | ForeignKey | FK -> Company | Công ty |
| `media_type` | ForeignKey | FK -> MediaType | Loại media |
| `media_url` | CharField |  | Url media |
| `thumbnail_url` | CharField | Null, Blank | Url thumbnail |
| `title` | CharField | Null, Blank | Tiêu đề |
| `caption` | TextField | Null, Blank | Mô tả |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Jobs

### Bảng: `jobs` (Model: `Job`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `company` | ForeignKey | FK -> Company | Công ty |
| `title` | CharField |  | Tiêu đề |
| `slug` | SlugField | Unique | Slug |
| `category` | ForeignKey | Null, Blank, FK -> JobCategory | Danh mục |
| `job_type` | CharField |  | Loại công việc |
| `level` | CharField |  | Cấp bậc |
| `experience_years_min` | IntegerField |  | Kinh nghiệm tối thiểu (năm) |
| `experience_years_max` | IntegerField | Null, Blank | Kinh nghiệm tối đa (năm) |
| `salary_min` | DecimalField | Null, Blank | Mức lương tối thiểu |
| `salary_max` | DecimalField | Null, Blank | Mức lương tối đa |
| `salary_currency` | CharField |  | Đơn vị tiền tệ |
| `salary_type` | CharField |  | Loại lương |
| `is_salary_negotiable` | BooleanField |  | Lương thỏa thuận |
| `number_of_positions` | IntegerField |  | Số lượng tuyển |
| `description` | TextField |  | Mô tả công việc |
| `requirements` | TextField |  | Yêu cầu |
| `benefits` | TextField | Null, Blank | Quyền lợi |
| `seo_title` | CharField | Blank | Seo title |
| `seo_description` | CharField | Blank | Seo description |
| `seo_keywords` | JSONField | Blank | Seo keywords |
| `address` | ForeignKey | Null, Blank, FK -> Address | Địa chỉ |
| `is_remote` | BooleanField |  | Làm việc từ xa |
| `application_deadline` | DateField | Null, Blank | Hạn nộp hồ sơ |
| `status` | CharField |  | Trạng thái |
| `view_count` | IntegerField |  | Lượt xem |
| `application_count` | IntegerField |  | Số đơn ứng tuyển |
| `featured` | BooleanField |  | Tin nổi bật |
| `featured_until` | DateField | Null, Blank | Nổi bật đến |
| `published_at` | DateTimeField | Null, Blank | Ngày đăng |
| `created_by` | ForeignKey | FK -> CustomUser | Người tạo |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Job_Categories

### Bảng: `job_categories` (Model: `JobCategory`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField |  | Tên danh mục |
| `slug` | SlugField | Unique | Slug |
| `description` | TextField | Null, Blank | Mô tả |
| `icon_url` | CharField | Null, Blank | Url icon |
| `parent` | ForeignKey | Null, Blank, FK -> JobCategory | Danh mục cha |
| `is_active` | BooleanField |  | Đang hoạt động |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Billing

### Bảng: `subscription_plans` (Model: `SubscriptionPlan`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `name` | CharField |  | Name |
| `slug` | SlugField | Unique | Slug |
| `price` | DecimalField |  | Price |
| `currency` | CharField |  | Currency |
| `duration_days` | IntegerField |  | Duration days |
| `features` | JSONField | Blank | Features |
| `is_active` | BooleanField |  | Is active |

### Bảng: `company_subscriptions` (Model: `CompanySubscription`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `company` | ForeignKey | FK -> Company | Company |
| `plan` | ForeignKey | FK -> SubscriptionPlan | Plan |
| `start_date` | DateField |  | Start date |
| `end_date` | DateField |  | End date |
| `status` | CharField |  | Status |
| `auto_renew` | BooleanField |  | Auto renew |

### Bảng: `payment_methods` (Model: `PaymentMethod`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `name` | CharField |  | Name |
| `code` | CharField | Unique | Code |
| `config` | JSONField | Blank | Config |
| `is_active` | BooleanField |  | Is active |

### Bảng: `transactions` (Model: `Transaction`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `company` | ForeignKey | FK -> Company | Company |
| `payment_method` | ForeignKey | Null, FK -> PaymentMethod | Payment method |
| `amount` | DecimalField |  | Amount |
| `currency` | CharField |  | Currency |
| `type` | CharField |  | Type |
| `status` | CharField |  | Status |
| `reference_code` | CharField | Unique, Null, Blank | Reference code |
| `description` | TextField | Blank | Description |
| `metadata` | JSONField | Blank | Metadata |
| `vnp_TransactionNo` | CharField | Null, Blank | Vnp transactionno |
| `vnp_BankCode` | CharField | Null, Blank | Vnp bankcode |
| `vnp_CardType` | CharField | Null, Blank | Vnp cardtype |
| `vnp_OrderInfo` | TextField | Null, Blank | Vnp orderinfo |
| `ip_address` | GenericIPAddressField | Null, Blank | Ip address |

## Module: Recruitment_Job_Skills

### Bảng: `job_skills` (Model: `JobSkill`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `job` | ForeignKey | FK -> Job | Công việc |
| `skill` | ForeignKey | FK -> Skill | Kỹ năng |
| `is_required` | BooleanField |  | Bắt buộc |
| `proficiency_level` | CharField | Null, Blank | Mức độ yêu cầu |
| `years_required` | IntegerField | Null, Blank | Số năm yêu cầu |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Job_Locations

### Bảng: `job_locations` (Model: `JobLocation`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `job` | ForeignKey | FK -> Job | Công việc |
| `address` | ForeignKey | FK -> Address | Địa chỉ |
| `is_primary` | BooleanField |  | Địa điểm chính |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Applications

### Bảng: `applications` (Model: `Application`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `job` | ForeignKey | FK -> Job | Công việc |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `cv` | ForeignKey | Null, Blank, FK -> RecruiterCV | Cv |
| `cover_letter` | TextField | Null, Blank | Thư xin việc |
| `status` | CharField |  | Trạng thái |
| `rating` | IntegerField | Null, Blank | Đánh giá |
| `notes` | TextField | Null, Blank | Ghi chú |
| `applied_at` | DateTimeField | Blank | Ngày ứng tuyển |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |
| `reviewed_by` | ForeignKey | Null, Blank, FK -> CustomUser | Người xem xét |
| `reviewed_at` | DateTimeField | Null, Blank | Ngày xem xét |

## Module: Recruitment_Application_Status_History

### Bảng: `application_status_history` (Model: `ApplicationStatusHistory`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `application` | ForeignKey | FK -> Application | Đơn ứng tuyển |
| `old_status` | CharField | Null, Blank | Trạng thái cũ |
| `new_status` | CharField |  | Trạng thái mới |
| `changed_by` | ForeignKey | FK -> CustomUser | Người thay đổi |
| `notes` | TextField | Null, Blank | Ghi chú |
| `created_at` | DateTimeField | Blank | Ngày tạo |

## Module: Recruitment_Interviews

### Bảng: `interviews` (Model: `Interview`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `application` | ForeignKey | FK -> Application | Đơn ứng tuyển |
| `interview_type` | ForeignKey | FK -> InterviewType | Loại phỏng vấn |
| `round_number` | IntegerField |  | Vòng phỏng vấn |
| `scheduled_at` | DateTimeField |  | Thời gian phỏng vấn |
| `duration_minutes` | IntegerField |  | Thời lượng (phút) |
| `address` | ForeignKey | Null, Blank, FK -> Address | Địa điểm |
| `meeting_link` | CharField | Null, Blank | Link meeting |
| `status` | CharField |  | Trạng thái |
| `notes` | TextField | Null, Blank | Ghi chú |
| `feedback` | TextField | Null, Blank | Nhận xét |
| `rating` | IntegerField | Null, Blank | Đánh giá |
| `interviewer` | ForeignKey | Null, Blank, FK -> CustomUser | Người phỏng vấn |
| `role` | CharField | Null, Blank | Vai trò |
| `result` | CharField |  | Kết quả |
| `created_by` | ForeignKey | FK -> CustomUser | Người tạo |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Interview_Types

### Bảng: `interview_types` (Model: `InterviewType`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField | Unique | Tên loại phỏng vấn |
| `description` | TextField | Null, Blank | Mô tả |
| `icon_url` | CharField | Null, Blank | Url icon |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Saved_Jobs

### Bảng: `saved_jobs` (Model: `SavedJob`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `job` | ForeignKey | FK -> Job | Công việc |
| `folder_name` | CharField | Null, Blank | Tên thư mục |
| `notes` | TextField | Null, Blank | Ghi chú |
| `created_at` | DateTimeField | Blank | Ngày lưu |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Recruitment_Job_Views

### Bảng: `job_views` (Model: `JobView`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `job` | ForeignKey | FK -> Job | Công việc |
| `user` | ForeignKey | Null, Blank, FK -> CustomUser | Người xem |
| `ip_address` | GenericIPAddressField | Null, Blank | Địa chỉ ip |
| `user_agent` | TextField | Null, Blank | User agent |
| `referrer` | CharField | Null, Blank | Nguồn truy cập |
| `viewed_at` | DateTimeField | Blank | Thời gian xem |

## Module: Candidate_Recruiters

### Bảng: `recruiters` (Model: `Recruiter`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `user` | OneToOneField | Unique, FK -> CustomUser | Tài khoản |
| `current_company` | ForeignKey | Null, Blank, FK -> Company | Công ty hiện tại |
| `current_position` | CharField | Null, Blank | Vị trí hiện tại |
| `date_of_birth` | DateField | Null, Blank | Ngày sinh |
| `gender` | CharField | Null, Blank | Giới tính |
| `address` | ForeignKey | Null, Blank, FK -> Address | Địa chỉ |
| `bio` | TextField | Null, Blank | Giới thiệu bản thân |
| `linkedin_url` | CharField | Null, Blank | Linkedin url |
| `facebook_url` | CharField | Null, Blank | Facebook url |
| `github_url` | CharField | Null, Blank | Github url |
| `portfolio_url` | CharField | Null, Blank | Portfolio url |
| `job_search_status` | CharField |  | Trạng thái tìm việc |
| `desired_salary_min` | DecimalField | Null, Blank | Mức lương tối thiểu mong muốn |
| `desired_salary_max` | DecimalField | Null, Blank | Mức lương tối đa mong muốn |
| `salary_currency` | CharField |  | Đơn vị tiền tệ |
| `available_from_date` | DateField | Null, Blank | Ngày có thể bắt đầu |
| `years_of_experience` | IntegerField |  | Số năm kinh nghiệm |
| `highest_education_level` | CharField | Null, Blank | Trình độ học vấn cao nhất |
| `profile_completeness_score` | IntegerField |  | Điểm hoàn thiện hồ sơ |
| `is_profile_public` | BooleanField |  | Hồ sơ công khai |
| `profile_views_count` | IntegerField |  | Lượt xem hồ sơ |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Recruiter_Education

### Bảng: `recruiter_education` (Model: `RecruiterEducation`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Recruiter |
| `school_name` | CharField |  | School name |
| `degree` | CharField | Null, Blank | Degree |
| `field_of_study` | CharField | Null, Blank | Field of study |
| `start_date` | DateField | Null, Blank | Start date |
| `end_date` | DateField | Null, Blank | End date |
| `is_current` | BooleanField |  | Is current |
| `gpa` | DecimalField | Null, Blank | Gpa |
| `description` | TextField | Null, Blank | Description |
| `display_order` | IntegerField |  | Display order |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |

## Module: Candidate_Recruiter_Experience

### Bảng: `recruiter_experience` (Model: `RecruiterExperience`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `company_name` | CharField |  | Tên công ty |
| `job_title` | CharField |  | Chức danh |
| `industry` | ForeignKey | Null, Blank, FK -> Industry | Ngành nghề |
| `start_date` | DateField |  | Ngày bắt đầu |
| `end_date` | DateField | Null, Blank | Ngày kết thúc |
| `is_current` | BooleanField |  | Công việc hiện tại |
| `description` | TextField | Null, Blank | Mô tả công việc |
| `address` | ForeignKey | Null, Blank, FK -> Address | Địa chỉ |
| `achievements` | TextField | Null, Blank | Thành tựu |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Recruiter_Skills

### Bảng: `recruiter_skills` (Model: `RecruiterSkill`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `skill` | ForeignKey | FK -> Skill | Kỹ năng |
| `proficiency_level` | CharField |  | Mức độ thành thạo |
| `years_of_experience` | IntegerField | Null, Blank | Số năm kinh nghiệm |
| `is_verified` | BooleanField |  | Đã xác minh |
| `endorsement_count` | IntegerField |  | Số lượt xác nhận |
| `last_used_date` | DateField | Null, Blank | Ngày sử dụng gần nhất |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Recruiter_Certifications

### Bảng: `recruiter_certifications` (Model: `RecruiterCertification`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `certification_name` | CharField |  | Tên chứng chỉ |
| `issuing_organization` | CharField | Null, Blank | Tổ chức cấp |
| `issue_date` | DateField | Null, Blank | Ngày cấp |
| `expiry_date` | DateField | Null, Blank | Ngày hết hạn |
| `credential_id` | CharField | Null, Blank | Mã chứng chỉ |
| `credential_url` | CharField | Null, Blank | Url xác minh |
| `does_not_expire` | BooleanField |  | Không hết hạn |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Recruiter_Languages

### Bảng: `recruiter_languages` (Model: `RecruiterLanguage`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `language` | ForeignKey | FK -> Language | Ngôn ngữ |
| `proficiency_level` | CharField |  | Trình độ |
| `is_native` | BooleanField |  | Ngôn ngữ mẹ đẻ |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Recruiter_Projects

### Bảng: `recruiter_projects` (Model: `RecruiterProject`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `project_name` | CharField |  | Tên dự án |
| `description` | TextField | Null, Blank | Mô tả |
| `project_url` | CharField | Null, Blank | Url dự án |
| `start_date` | DateField | Null, Blank | Ngày bắt đầu |
| `end_date` | DateField | Null, Blank | Ngày kết thúc |
| `is_ongoing` | BooleanField |  | Đang thực hiện |
| `technologies_used` | TextField | Null, Blank | Công nghệ sử dụng |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Recruiter_Cvs

### Bảng: `recruiter_cvs` (Model: `RecruiterCV`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `template` | ForeignKey | Null, Blank, FK -> CVTemplate | Mẫu cv |
| `cv_name` | CharField |  | Tên cv |
| `cv_data` | JSONField |  | Dữ liệu cv |
| `cv_url` | CharField | Null, Blank | Url cv |
| `is_default` | BooleanField |  | Cv mặc định |
| `is_public` | BooleanField |  | Cv công khai |
| `view_count` | IntegerField |  | Lượt xem |
| `download_count` | IntegerField |  | Lượt tải |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Cv_Templates

### Bảng: `cv_templates` (Model: `CVTemplate`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField |  | Tên mẫu |
| `file_name` | CharField | Null, Blank | Tên file html template |
| `category` | ForeignKey | FK -> CVTemplateCategory | Danh mục |
| `thumbnail_url` | CharField | Null, Blank | Url ảnh thumbnail |
| `preview_url` | CharField | Null, Blank | Url xem trước |
| `template_data` | JSONField | Null, Blank | Dữ liệu mẫu |
| `is_premium` | BooleanField |  | Mẫu cao cấp |
| `price` | DecimalField |  | Giá |
| `usage_count` | IntegerField |  | Số lần sử dụng |
| `rating` | DecimalField |  | Đánh giá |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Cv_Template_Categories

### Bảng: `cv_template_categories` (Model: `CVTemplateCategory`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField |  | Tên danh mục |
| `slug` | SlugField | Unique | Slug |
| `description` | TextField | Null, Blank | Mô tả |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |
| `display_order` | IntegerField |  | Thứ tự hiển thị |

## Module: Candidate_Skills

### Bảng: `skills` (Model: `Skill`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField | Unique | Tên kỹ năng |
| `slug` | SlugField | Unique | Slug |
| `category` | ForeignKey | FK -> SkillCategory | Danh mục |
| `description` | TextField | Null, Blank | Mô tả |
| `is_verified` | BooleanField |  | Đã xác minh |
| `usage_count` | IntegerField |  | Số lần sử dụng |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Skill_Categories

### Bảng: `skill_categories` (Model: `SkillCategory`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `name` | CharField |  | Tên danh mục |
| `slug` | SlugField | Unique | Slug |
| `description` | TextField | Null, Blank | Mô tả |
| `parent` | ForeignKey | Null, Blank, FK -> SkillCategory | Danh mục cha |
| `is_active` | BooleanField |  | Đang hoạt động |
| `display_order` | IntegerField |  | Thứ tự hiển thị |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Candidate_Languages

### Bảng: `languages` (Model: `Language`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `language_code` | CharField | Unique | Mã ngôn ngữ |
| `language_name` | CharField |  | Tên ngôn ngữ |
| `native_name` | CharField | Null, Blank | Tên bản địa |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Social_Company_Followers

### Bảng: `company_followers` (Model: `CompanyFollower`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `company` | ForeignKey | FK -> Company | Công ty |
| `recruiter` | ForeignKey | FK -> Recruiter | Người theo dõi |
| `created_at` | DateTimeField | Blank | Ngày theo dõi |

## Module: Communication_Notifications

### Bảng: `notifications` (Model: `Notification`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `user` | ForeignKey | FK -> CustomUser | Người dùng |
| `notification_type` | ForeignKey | FK -> NotificationType | Loại thông báo |
| `title` | CharField |  | Tiêu đề |
| `content` | TextField |  | Nội dung |
| `link` | CharField | Null, Blank | Link |
| `entity_type` | CharField | Null, Blank | Loại đối tượng |
| `entity_id` | IntegerField | Null, Blank | Id đối tượng |
| `is_read` | BooleanField |  | Đã đọc |
| `read_at` | DateTimeField | Null, Blank | Đọc lúc |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Communication_Notification_Types

### Bảng: `notification_types` (Model: `NotificationType`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `type_name` | CharField | Unique | Tên loại thông báo |
| `description` | TextField | Null, Blank | Mô tả |
| `template` | TextField | Null, Blank | Template |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: Job Alerts

### Bảng: `job_alerts` (Model: `JobAlert`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `recruiter` | ForeignKey | FK -> Recruiter | Ứng viên |
| `alert_name` | CharField |  | Tên thông báo |
| `keywords` | TextField | Null, Blank | Từ khóa |
| `category` | ForeignKey | Null, Blank, FK -> JobCategory | Danh mục |
| `job_type` | CharField | Null, Blank | Loại công việc |
| `level` | CharField | Null, Blank | Cấp bậc |
| `salary_min` | DecimalField | Null, Blank | Mức lương tối thiểu |
| `is_active` | BooleanField |  | Đang hoạt động |
| `frequency` | CharField |  | Tần suất |
| `email_notification` | BooleanField |  | Nhận email thông báo |
| `use_ai_matching` | BooleanField |  | Sử dụng ai match |
| `last_sent_at` | DateTimeField | Null, Blank | Gửi lần cuối |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |
| `locations` | ManyToManyField | Blank, FK -> Province | Địa điểm làm việc |
| `skills` | ManyToManyField | Blank, FK -> Skill | Kỹ năng |

### Bảng: `job_alert_matches` (Model: `JobAlertMatch`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `job_alert` | ForeignKey | FK -> JobAlert | Job alert |
| `job` | ForeignKey | FK -> Job | Việc làm |
| `is_sent` | BooleanField |  | Đã gửi thông báo |
| `is_viewed` | BooleanField |  | Đã xem |
| `matched_at` | DateTimeField | Blank | Thời điểm khớp |
| `score` | FloatField |  | Điểm phù hợp |

## Module: Communication_Job_Alert_Skills

### Bảng: `job_alert_skills` (Model: `JobAlertSkill`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `job_alert` | ForeignKey | FK -> JobAlert | Thông báo việc làm |
| `skill` | ForeignKey | FK -> Skill | Kỹ năng |
| `created_at` | DateTimeField | Blank | Ngày tạo |

## Module: Blog

### Bảng: `blog_category` (Model: `Category`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `name` | CharField |  | Name |
| `slug` | SlugField | Unique, Blank | Slug |
| `description` | TextField | Blank | Description |

### Bảng: `blog_tag` (Model: `Tag`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `name` | CharField |  | Name |
| `slug` | SlugField | Unique, Blank | Slug |

### Bảng: `blog_post` (Model: `Post`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `created_at` | DateTimeField | Blank | Created at |
| `updated_at` | DateTimeField | Blank | Updated at |
| `title` | CharField |  | Title |
| `slug` | SlugField | Unique, Blank | Slug |
| `author` | ForeignKey | FK -> CustomUser | Author |
| `company` | ForeignKey | Null, Blank, FK -> Company | Công ty |
| `category` | ForeignKey | Null, FK -> Category | Category |
| `summary` | TextField | Blank | Summary |
| `content` | TextField |  | Content |
| `thumbnail` | CharField | Null, Blank | Thumbnail url |
| `status` | CharField |  | Status |
| `published_at` | DateTimeField | Null, Blank | Published at |
| `view_count` | PositiveIntegerField |  | View count |
| `meta_title` | CharField | Blank | Meta title |
| `meta_description` | TextField | Blank | Meta description |
| `is_featured` | BooleanField |  | Bài viết nổi bật |
| `tags` | ManyToManyField | Blank, FK -> Tag | Tags |

## Module: System_System_Settings

### Bảng: `system_settings` (Model: `SystemSetting`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `setting_key` | CharField | Unique | Khóa |
| `setting_value` | TextField | Null, Blank | Giá trị |
| `setting_type` | CharField |  | Loại |
| `category` | CharField | Null, Blank | Danh mục |
| `description` | TextField | Null, Blank | Mô tả |
| `is_public` | BooleanField |  | Công khai |
| `updated_by` | ForeignKey | Null, Blank, FK -> CustomUser | Người cập nhật |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: System_Activity_Logs

### Bảng: `activity_logs` (Model: `ActivityLog`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `user` | ForeignKey | Null, Blank, FK -> CustomUser | Người dùng |
| `log_type` | ForeignKey | FK -> ActivityLogType | Loại hoạt động |
| `action` | CharField |  | Hành động |
| `entity_type` | CharField | Null, Blank | Loại đối tượng |
| `entity_id` | IntegerField | Null, Blank | Id đối tượng |
| `ip_address` | GenericIPAddressField | Null, Blank | Địa chỉ ip |
| `user_agent` | TextField | Null, Blank | User agent |
| `details` | JSONField | Null, Blank | Chi tiết |
| `created_at` | DateTimeField | Blank | Ngày tạo |

## Module: System_Activity_Log_Types

### Bảng: `activity_log_types` (Model: `ActivityLogType`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `type_name` | CharField | Unique | Tên loại |
| `description` | TextField | Null, Blank | Mô tả |
| `severity` | CharField |  | Mức độ |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: System_File_Uploads

### Bảng: `file_uploads` (Model: `FileUpload`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `user` | ForeignKey | FK -> CustomUser | Người dùng |
| `file_name` | CharField |  | Tên file |
| `original_name` | CharField |  | Tên file gốc |
| `file_path` | CharField |  | Đường dẫn file |
| `file_type` | CharField | Null, Blank | Loại file |
| `file_size` | IntegerField | Null, Blank | Kích thước (bytes) |
| `mime_type` | CharField | Null, Blank | Mime type |
| `entity_type` | CharField | Null, Blank | Loại đối tượng |
| `entity_id` | IntegerField | Null, Blank | Id đối tượng |
| `is_public` | BooleanField |  | Công khai |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: System_Report_Types

### Bảng: `report_types` (Model: `ReportType`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `type_name` | CharField | Unique | Tên loại báo cáo |
| `description` | TextField | Null, Blank | Mô tả |
| `template` | JSONField | Null, Blank | Template |
| `is_active` | BooleanField |  | Đang hoạt động |
| `created_at` | DateTimeField | Blank | Ngày tạo |
| `updated_at` | DateTimeField | Blank | Ngày cập nhật |

## Module: System_Reports

### Bảng: `reports` (Model: `Report`)

| Tên trường | Kiểu dữ liệu | Thuộc tính | Mô tả |
| --- | --- | --- | --- |
| `id` | BigAutoField | PK, Unique, Blank | Id |
| `reporter` | ForeignKey | FK -> CustomUser | Người báo cáo |
| `report_type` | ForeignKey | FK -> ReportType | Loại báo cáo |
| `entity_type` | CharField |  | Loại đối tượng |
| `entity_id` | IntegerField |  | Id đối tượng |
| `description` | TextField |  | Mô tả |
| `status` | CharField |  | Trạng thái |
| `resolution_notes` | TextField | Null, Blank | Ghi chú xử lý |
| `resolved_by` | ForeignKey | Null, Blank, FK -> CustomUser | Người xử lý |
| `resolved_at` | DateTimeField | Null, Blank | Ngày xử lý |
| `created_at` | DateTimeField | Blank | Ngày tạo |

