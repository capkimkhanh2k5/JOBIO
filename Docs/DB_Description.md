# Mô tả chức năng các bảng trong Cơ sở dữ liệu

Dưới đây là mô tả ngắn gọn về chức năng của từng bảng trong hệ thống, được phân chia theo các module.

## Module: Core_Users

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `users` | `CustomUser` | Lưu trữ thông tin của user (tài khoản người dùng trong hệ thống). |
| `user_passkeys` | `UserPasskey` | Lưu trữ thông tin xác thực passkey của người dùng để hỗ trợ đăng nhập không mật khẩu. |

## Module: Geography

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `provinces` | `Province` | Lưu trữ danh sách các tỉnh/thành phố. |
| `communes` | `Commune` | Lưu trữ danh sách các xã/phường thuộc các tỉnh/thành phố. |
| `addresses` | `Address` | Lưu trữ thông tin địa chỉ cụ thể của người dùng, công ty hoặc công việc. |

## Module: Company

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `companies` | `Company` | Lưu trữ thông tin chi tiết về các công ty/doanh nghiệp trên hệ thống. |
| `industries` | `Industry` | Lưu trữ danh mục các lĩnh vực/ngành nghề hoạt động của công ty. |
| `benefit_categories` | `BenefitCategory` | Lưu trữ danh mục các loại phúc lợi mà công ty có thể cung cấp. |
| `company_benefits` | `CompanyBenefit` | Lưu trữ thông tin về các phúc lợi cụ thể của từng công ty. |
| `media_types` | `MediaType` | Lưu trữ danh sách các loại media (hình ảnh, video, tài liệu...). |
| `company_media` | `CompanyMedia` | Lưu trữ các tệp truyền thông (ảnh, video) giới thiệu về công ty. |

## Module: Recruitment

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `jobs` | `Job` | Lưu trữ thông tin chi tiết về các tin tuyển dụng/việc làm. |
| `job_categories` | `JobCategory` | Lưu trữ danh mục các loại công việc/ngành nghề tuyển dụng. |
| `job_skills` | `JobSkill` | Lưu trữ danh sách các kỹ năng yêu cầu cho từng công việc. |
| `job_locations` | `JobLocation` | Lưu trữ thông tin địa điểm làm việc của từng công việc. |
| `applications` | `Application` | Lưu trữ thông tin đơn ứng tuyển của ứng viên vào các công việc. |
| `application_status_history` | `ApplicationStatusHistory` | Lưu trữ lịch sử thay đổi trạng thái của các đơn ứng tuyển. |
| `interviews` | `Interview` | Lưu trữ thông tin lịch trình phỏng vấn giữa công ty và ứng viên. |
| `interview_types` | `InterviewType` | Lưu trữ danh mục các hình thức phỏng vấn (trực tuyến, trực tiếp...). |
| `saved_jobs` | `SavedJob` | Lưu trữ danh sách các công việc mà ứng viên đã lưu lại. |
| `job_views` | `JobView` | Lưu trữ thống kê lượt xem các tin tuyển dụng. |

## Module: Candidate (Recruiter/Ứng viên)

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `recruiters` | `Recruiter` | Lưu trữ hồ sơ thông tin của các ứng viên (candidate). |
| `recruiter_education` | `RecruiterEducation` | Lưu trữ thông tin quá trình học tập/đào tạo của ứng viên. |
| `recruiter_experience` | `RecruiterExperience` | Lưu trữ thông tin kinh nghiệm làm việc của ứng viên. |
| `recruiter_skills` | `RecruiterSkill` | Lưu trữ danh sách các kỹ năng mà ứng viên sở hữu. |
| `recruiter_certifications` | `RecruiterCertification` | Lưu trữ thông tin về các chứng chỉ/bằng cấp của ứng viên. |
| `recruiter_languages` | `RecruiterLanguage` | Lưu trữ thông tin ngoại ngữ của ứng viên. |
| `recruiter_projects` | `RecruiterProject` | Lưu trữ thông tin về các dự án mà ứng viên đã tham gia. |
| `recruiter_cvs` | `RecruiterCV` | Lưu trữ các bản CV (sơ yếu lý lịch) của ứng viên. |
| `cv_templates` | `CVTemplate` | Lưu trữ các mẫu CV có sẵn trên hệ thống để ứng viên sử dụng. |
| `cv_template_categories` | `CVTemplateCategory` | Lưu trữ danh mục phân loại các mẫu CV. |
| `skills` | `Skill` | Lưu trữ từ điển các kỹ năng chuẩn trên hệ thống. |
| `skill_categories` | `SkillCategory` | Lưu trữ danh mục phân loại các kỹ năng. |
| `languages` | `Language` | Lưu trữ danh sách các ngôn ngữ được hỗ trợ. |

## Module: Billing

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `subscription_plans` | `SubscriptionPlan` | Lưu trữ thông tin các gói dịch vụ (subscription) có sẵn trên hệ thống. |
| `company_subscriptions` | `CompanySubscription` | Lưu trữ thông tin đăng ký gói dịch vụ của các công ty. |
| `payment_methods` | `PaymentMethod` | Lưu trữ danh sách các phương thức thanh toán được hỗ trợ. |
| `transactions` | `Transaction` | Lưu trữ thông tin lịch sử giao dịch thanh toán. |

## Module: Social & Communication

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `company_followers` | `CompanyFollower` | Lưu trữ thông tin những người theo dõi các công ty. |
| `notifications` | `Notification` | Lưu trữ thông báo gửi đến người dùng trong hệ thống. |
| `notification_types` | `NotificationType` | Lưu trữ các loại thông báo khác nhau trong hệ thống. |

## Module: Job Alerts

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `job_alerts` | `JobAlert` | Lưu trữ cấu hình nhận thông báo việc làm của ứng viên. |
| `job_alert_matches` | `JobAlertMatch` | Lưu trữ các công việc phù hợp với cấu hình thông báo việc làm đã thiết lập. |
| `job_alert_skills` | `JobAlertSkill` | Lưu trữ kỹ năng mong muốn trong cấu hình thông báo việc làm. |

## Module: Blog

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `blog_category` | `Category` | Lưu trữ danh mục các bài viết blog/tin tức. |
| `blog_tag` | `Tag` | Lưu trữ các thẻ (tag) để phân loại bài viết blog. |
| `blog_post` | `Post` | Lưu trữ nội dung các bài viết blog/tin tức trên hệ thống. |

## Module: System

| Tên bảng | Model | Mô tả chức năng |
| --- | --- | --- |
| `system_settings` | `SystemSetting` | Lưu trữ các cấu hình, cài đặt chung của hệ thống. |
| `activity_logs` | `ActivityLog` | Lưu trữ nhật ký hoạt động của người dùng trong hệ thống (Audit log). |
| `activity_log_types` | `ActivityLogType` | Lưu trữ danh mục các loại hoạt động có thể được ghi lại. |
| `file_uploads` | `FileUpload` | Lưu trữ thông tin các file đã được tải lên hệ thống. |
| `report_types` | `ReportType` | Lưu trữ danh mục các loại báo cáo vi phạm, khiếu nại. |
| `reports` | `Report` | Lưu trữ các báo cáo vi phạm hoặc khiếu nại từ người dùng. |
