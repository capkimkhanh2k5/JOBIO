# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Ứng viên (Candidates):** Người tìm việc muốn tạo CV, quản lý hồ sơ, và tìm kiếm cơ hội nghề nghiệp phù hợp.
- **Doanh nghiệp (Companies):** Các nhà tuyển dụng B2B cần đăng tin tuyển dụng, quản lý hồ sơ ứng viên (pipeline), lên lịch phỏng vấn và phân tích hiệu quả tuyển dụng. Trải nghiệm B2B là trọng tâm của nền tảng.
- **Quản trị viên (Admins):** Đội ngũ vận hành hệ thống, kiểm duyệt nội dung, xử lý báo cáo vi phạm, và quản lý tài chính/gói dịch vụ.

## Product Purpose
JOBIO là nền tảng tuyển dụng thông minh fullstack kết nối ứng viên, doanh nghiệp và quản trị viên. Hệ thống số hóa toàn bộ hành trình tuyển dụng từ tìm việc, tạo CV, ứng tuyển đến quản lý pipeline ứng viên, phỏng vấn và thanh toán gói dịch vụ B2B.

## Positioning
Một hệ sinh thái tuyển dụng End-to-End được tích hợp AI để bóc tách dữ liệu CV (Parsing) và tự động gợi ý việc làm (Job Matching). Điểm khác biệt nằm ở việc tập trung mạnh vào các công cụ chuyên nghiệp, mang tính định hướng B2B giúp doanh nghiệp tối ưu hóa quy trình quản lý ứng viên.

## Operating Context
- Hoạt động chủ yếu trên trình duyệt web.
- Ngữ cảnh bao gồm quá trình tìm việc của ứng viên và các quy trình quản trị nhân sự/tuyển dụng chuyên sâu của doanh nghiệp.
- Giao dịch tài chính (mua gói dịch vụ) được thực hiện qua cổng VNPay.
- Giao tiếp và tương tác thông qua thông báo theo thời gian thực (Channels/SSE).

## Capabilities and Constraints
- **Frontend Stack:** React 19, TypeScript, Vite, Tailwind CSS 4.
- **Backend Stack:** Django 5.2 REST API, PostgreSQL, Redis, Celery (xử lý tác vụ nền).
- **Tích hợp:** Google OAuth, WebAuthn/Passkey, Cloudinary (Media), VNPay (Thanh toán).
- **AI:** Tích hợp AI (OpenAI/Groq/Gemini) phục vụ việc CV Parsing & Job Matching.
- **Triển khai:** Docker Compose trên GCP VM.

## Brand Commitments
- **Phong cách & Tone giọng:** Chuyên nghiệp, đáng tin cậy, đặc biệt hướng tới phục vụ khối doanh nghiệp (B2B).
- **Tài sản thương hiệu:** Logo hệ thống (`asset/LOGO.png`).
- **Kỳ vọng thiết kế:** Thiết kế nổi bật, khác biệt rõ nét so với các nền tảng tuyển dụng truyền thống trên thị trường hiện nay.

## Evidence on Hand
- Có sẵn cấu trúc kiến trúc, tài liệu Database và README chi tiết.
- Đã có tập dữ liệu mẫu (Dataset/seed data) hỗ trợ việc demo hệ thống.
- Các giao diện hiện tại đóng vai trò là bằng chứng về dữ liệu, nhưng không trói buộc sáng tạo thiết kế mới.

## Product Principles
1. **Thiết kế Nổi bật & Khác biệt:** Tạo ra trải nghiệm thị giác vượt trội, không đi theo lối mòn của các trang tuyển dụng cũ.
2. **Trải nghiệm Mượt mà (Seamless UX):** Tính năng phải tinh gọn, dễ sử dụng, giảm thiểu ma sát ở mọi điểm chạm.
3. **Độ Tin cậy & Bảo mật:** Đảm bảo hệ thống ổn định và bảo mật tuyệt đối cho dữ liệu nhạy cảm như CV và giao dịch thanh toán VNPay.
4. **B2B-Centric:** Đặt quy trình làm việc của nhà tuyển dụng lên hàng đầu, đảm bảo tính chuyên nghiệp và hiệu quả cao.
