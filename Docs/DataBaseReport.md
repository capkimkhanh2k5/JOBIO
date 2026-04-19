# Báo cáo Danh sách Bảng trong Database (Đã thu gọn & Chi tiết)

Dưới đây là toàn bộ các bảng trong hệ thống được phân loại theo các nhóm chức năng chính (Module).

**Tổng số bảng tự định nghĩa: 77**

## 1. Quản lý Người dùng & Xác thực (Core / Auth)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `auth_permission` | **Permission** | Bảng của Django để quản lý các quyền truy cập vào hệ thống (thêm, sửa, xoá). **(Django mặc định)** |
| `auth_group` | **Group** | Phân quyền người dùng theo nhóm (Role-based access control), ví dụ: nhóm Admin, nhóm User. **(Django mặc định)** |
| `django_session` | **Session** | Lưu trữ thông tin phiên đăng nhập của người dùng. **(Django mặc định)** |
| `token_blacklist_outstandingtoken` | **OutstandingToken** | Lưu trữ danh sách các JWT token đã cấp phát cho người dùng. **(Thư viện ngoài - SimpleJWT)** |
| `token_blacklist_blacklistedtoken` | **BlacklistedToken** | Lưu trữ JWT token đã bị thu hồi (sau khi người dùng đăng xuất) để chống tái sử dụng. **(Thư viện ngoài - SimpleJWT)** |
| `users` | **CustomUser** | Bảng cốt lõi quản lý thông tin đăng nhập (email, password) và hồ sơ cơ bản của mọi tài khoản (Admin, Công ty, Ứng viên). |
| `user_passkeys` | **UserPasskey** | Lưu trữ thông tin xác thực không mật khẩu (Passkey / WebAuthn) để hỗ trợ đăng nhập sinh trắc học. |


## 2. Quản lý Công ty (Company)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `companies` | **Company** | Hồ sơ chi tiết của các công ty tuyển dụng (tên, mô tả, logo, quy mô, MST). |
| `industries` | **Industry** | Từ điển các nhóm ngành nghề kinh doanh (IT, Tài chính, Bán lẻ...). |
| `benefit_categories` | **BenefitCategory** | Từ điển phân loại các nhóm phúc lợi (Bảo hiểm, Nghỉ phép, Thưởng, Sức khỏe). |
| `company_benefits` | **CompanyBenefit** | Lưu trữ chi tiết các loại phúc lợi cụ thể mà một công ty cung cấp cho nhân viên của họ. |
| `media_types` | **MediaType** | Phân loại định dạng tệp đa phương tiện giới thiệu (Hình ảnh, Video, Văn bản). |
| `company_media` | **CompanyMedia** | Bộ sưu tập hình ảnh, video giới thiệu văn phòng và môi trường làm việc của công ty. |


## 3. Quản lý Tuyển dụng (Recruitment)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `jobs` | **Job** | Thông tin chi tiết các tin đăng tuyển dụng (tiêu đề, mức lương, yêu cầu công việc, trạng thái hiển thị). |
| `job_categories` | **JobCategory** | Từ điển danh mục vị trí công việc (Backend Developer, Kế toán, Nhân sự...). |
| `job_skills` | **JobSkill** | Liên kết các kỹ năng bắt buộc/ưu tiên cho một tin tuyển dụng cụ thể. |
| `job_locations` | **JobLocation** | Thông tin địa điểm làm việc thực tế cho từng tin tuyển dụng. |
| `applications` | **Application** | Quản lý các đơn ứng tuyển (gồm CV, thư xin việc) của ứng viên nộp vào các tin tuyển dụng. |
| `application_status_history` | **ApplicationStatusHistory** | Nhật ký ghi nhận các lần thay đổi trạng thái của đơn ứng tuyển (Chờ duyệt -> Phỏng vấn -> Trúng tuyển/Từ chối). |
| `interviews` | **Interview** | Quản lý lịch hẹn phỏng vấn cụ thể giữa nhà tuyển dụng và ứng viên. |
| `interview_types` | **InterviewType** | Phân loại hình thức phỏng vấn (Online, Trực tiếp tại văn phòng, Làm bài test). |
| `interview_interviewers` | **InterviewInterviewer** | Phân công người phụ trách phỏng vấn (Interviewer) cho một buổi phỏng vấn. |
| `saved_jobs` | **SavedJob** | Lưu trữ danh sách các công việc mà ứng viên đã bấm "Lưu lại" để xem hoặc ứng tuyển sau. |
| `job_views` | **JobView** | Ghi nhận và thống kê chi tiết lượt xem cho mỗi tin tuyển dụng. |


## 4. Quản lý Ứng viên (Candidate)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `recruiters` | **Recruiter** | Hồ sơ cá nhân chi tiết của người tìm việc (ứng viên), chứa các thông tin giới thiệu bản thân. |
| `recruiter_education` | **RecruiterEducation** | Lịch sử học vấn, bằng cấp, trường đại học của ứng viên. |
| `recruiter_experience` | **RecruiterExperience** | Lịch sử kinh nghiệm làm việc thực tế qua các công ty cũ của ứng viên. |
| `recruiter_skills` | **RecruiterSkill** | Bộ kỹ năng cá nhân cùng mức độ thành thạo của ứng viên. |
| `recruiter_certifications` | **RecruiterCertification** | Các chứng chỉ chuyên môn, chứng chỉ ngoại ngữ mà ứng viên đạt được. |
| `recruiter_languages` | **RecruiterLanguage** | Năng lực sử dụng ngoại ngữ của ứng viên. |
| `recruiter_projects` | **RecruiterProject** | Danh sách các dự án nổi bật mà ứng viên đã từng tham gia thực hiện. |
| `recruiter_cvs` | **RecruiterCV** | Kho lưu trữ các file CV (PDF) ứng viên đã tạo hoặc tải lên hệ thống. |
| `cv_templates` | **CVTemplate** | Kho mẫu CV định dạng sẵn do hệ thống cung cấp cho ứng viên sử dụng. |
| `cv_template_categories` | **CVTemplateCategory** | Phân loại các mẫu CV theo ngành nghề và phong cách (Sáng tạo, Chuyên nghiệp...). |
| `skills` | **Skill** | Từ điển chuẩn hóa tất cả các kỹ năng chung có trong hệ thống để người dùng chọn. |
| `skill_categories` | **SkillCategory** | Phân nhóm các kỹ năng chung (Kỹ năng cứng, kỹ năng mềm, kỹ năng IT...). |
| `languages` | **Language** | Từ điển chuẩn hóa các loại ngôn ngữ trên thế giới. |


## 5. Mạng xã hội & Tương tác (Social / Reviews / Blog)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `reviews` | **Review** | Quản lý các bài đánh giá, nhận xét (ẩn danh hoặc công khai) về môi trường làm việc của công ty. |
| `review_reactions` | **ReviewReaction** | Lưu trữ lượt thả cảm xúc (Thích/Hữu ích) của cộng đồng đối với các bài review. |
| `recommendations` | **Recommendation** | Các bài viết giới thiệu, đề xuất năng lực ứng viên từ đồng nghiệp hoặc người dùng khác. |
| `recruiter_connections` | **RecruiterConnection** | Quản lý mạng lưới kết bạn, theo dõi lẫn nhau giữa các người dùng (giống LinkedIn). |
| `skill_endorsements` | **SkillEndorsement** | Lưu trữ lượt xác nhận (endorse) kỹ năng từ người dùng khác cho ứng viên. |
| `company_followers` | **CompanyFollower** | Danh sách người dùng bấm theo dõi (Follow) để nhận tin tức, việc làm mới từ công ty. |
| `blog_category` | **Category** | Danh mục chuyên mục bài viết blog của hệ thống. |
| `blog_tag` | **Tag** | Các thẻ (Tags) để phân loại và dễ dàng tìm kiếm bài viết blog. |
| `blog_post` | **Post** | Quản lý nội dung các bài viết blog, tin tức, chia sẻ kinh nghiệm trên nền tảng. |


## 6. Thông báo & Giao tiếp (Communication / Email)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `django_eventstream_eventcounter` | **EventCounter** | Bảng hỗ trợ EventStream để theo dõi số lượng sự kiện realtime. **(Thư viện ngoài - EventStream)** |
| `django_eventstream_event` | **Event** | Quản lý luồng sự kiện truyền dữ liệu thời gian thực (ví dụ: tin nhắn, thông báo pop-up). **(Thư viện ngoài - EventStream)** |
| `notifications` | **Notification** | Quản lý nội dung danh sách thông báo (chuông báo) gửi đến người dùng trong hệ thống. |
| `notification_types` | **NotificationType** | Phân loại thông báo (Thông báo hệ thống, Cập nhật ứng tuyển, Tin nhắn mới). |
| `job_alerts` | **JobAlert** | Lưu cấu hình của ứng viên khi đăng ký nhận thông báo việc làm tự động qua email. |
| `job_alert_matches` | **JobAlertMatch** | Ghi nhận lịch sử các việc làm đã được ghép nối và gửi thành công cho ứng viên. |
| `job_alert_skills` | **JobAlertSkill** | Lưu các kỹ năng mục tiêu mà ứng viên cài đặt để hệ thống tìm job tương ứng. |
| `email_emailtemplatecategory` | **EmailTemplateCategory** | Phân loại các mẫu Email (Marketing, Thông báo tự động...). |
| `email_emailtemplate` | **EmailTemplate** | Quản lý cấu trúc, nội dung HTML của các mẫu email (Quên mật khẩu, Xác nhận ứng tuyển). |
| `email_sentemail` | **SentEmail** | Nhật ký lưu trữ lịch sử tất cả các email hệ thống đã gửi đi. |


## 7. Thanh toán & Gói cước (Billing)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `subscription_plans` | **SubscriptionPlan** | Quản lý các gói dịch vụ trả phí (Gói cơ bản, Gói VIP, Mua lượt đăng tin) dành cho Nhà tuyển dụng. |
| `company_subscriptions` | **CompanySubscription** | Lưu trữ thông tin công ty nào đang dùng gói dịch vụ nào, thời hạn còn bao lâu. |
| `payment_methods` | **PaymentMethod** | Cấu hình các cổng/phương thức thanh toán hỗ trợ (VNPay, Momo, Chuyển khoản). |
| `transactions` | **Transaction** | Ghi nhận chi tiết lịch sử giao dịch thanh toán mua gói cước của các công ty. |


## 8. Cấu hình & Báo cáo hệ thống (System / Analytics)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `django_admin_log` | **LogEntry** | Nhật ký ghi lại các thao tác thay đổi dữ liệu của Admin trên trang quản trị Django. **(Django mặc định)** |
| `django_content_type` | **ContentType** | Bảng cốt lõi của Django giúp liên kết các mô hình linh hoạt (Generic Relations) trong hệ thống. **(Django mặc định)** |
| `system_settings` | **SystemSetting** | Cấu hình các biến số chung của toàn hệ thống (Logo, Email liên hệ, Số lượng job tối đa...). |
| `activity_logs` | **ActivityLog** | Ghi nhận lịch sử hoạt động chi tiết của người dùng phục vụ cho theo dõi, bảo mật và audit. |
| `activity_log_types` | **ActivityLogType** | Phân loại các hành động được ghi log (Đăng nhập, Tải CV, Ứng tuyển). |
| `file_uploads` | **FileUpload** | Quản lý tập trung thông tin của mọi tệp tin đã được upload lên nền tảng. |
| `analytics_generatedreport` | **GeneratedReport** | Lưu trữ các tệp file báo cáo đã được trích xuất (export) ra tự động hoặc bằng tay. |
| `analytics_reports` | **AnalyticsReport** | Bảng điều khiển lưu trữ các chỉ số thống kê, báo cáo hoạt động chung của hệ thống. |
| `report_types` | **ReportType** | Phân loại định dạng và nội dung báo cáo. |
| `reports` | **Report** | Quản lý các Báo cáo vi phạm (Report) từ người dùng đối với các bài đăng, tin tuyển dụng hoặc công ty lừa đảo. |
| `audit_logs` | **AuditLog** | Bảng nhật ký kiểm toán chuyên sâu theo dõi các thay đổi dữ liệu hệ thống nhạy cảm. |
| `search_history` | **SearchHistory** | Lưu lại các từ khóa tìm kiếm chung của người dùng để phân tích xu hướng. |
| `faqs` | **FAQ** | Quản lý danh sách các câu hỏi thường gặp và câu trả lời (Trung tâm trợ giúp). |
| `job_search_history` | **JobSearchHistory** | Theo dõi và lưu trữ riêng các từ khóa tìm kiếm việc làm để cá nhân hóa gợi ý cho ứng viên. |


## 9. Địa lý (Geography)
| Tên Bảng (DB Table) | Tên Model | Chức năng chính |
|---|---|---|
| `provinces` | **Province** | Từ điển chuẩn hóa toàn bộ dữ liệu 63 Tỉnh/Thành phố Việt Nam. |
| `communes` | **Commune** | Từ điển chuẩn hóa dữ liệu cấp Quận/Huyện, Phường/Xã trên cả nước. |
| `addresses` | **Address** | Quản lý tập trung các chuỗi địa chỉ nhà ở/trụ sở cụ thể được liên kết linh hoạt trên hệ thống. |
