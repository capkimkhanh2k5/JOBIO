# TODO: Triển khai Giới hạn Gói dịch vụ (Pricing Plan Enforcement)

Tài liệu này hướng dẫn chi tiết các bước cần thực hiện trong Backend để áp dụng các giới hạn từ gói dịch vụ (Subscription Plan) vào tính năng tuyển dụng.

---

## 1. Hệ thống hóa việc lấy Gói dịch vụ (Subscription Helper)
Để tránh lặp lại code, cần tạo một hàm helper để lấy gói dịch vụ hiện tại của công ty.
- **Tệp đề xuất:** `backend/apps/billing/company_subscriptions/services/subscription.py`
- **Nhiệm vụ:** Viết hàm `get_active_subscription(company_id: int)` trả về `CompanySubscription` object nếu còn hạn và trạng thái là `active`.

## 2. Giới hạn Số lượng Tin đăng (Job Posting Limit)
Chặn việc tạo tin mới nếu công ty đã dùng hết số lượng tin cho phép trong gói.
- **Tập tin:** `backend/apps/recruitment/jobs/services/jobs.py`
- **Hàm cần sửa:** `create_job`
- **Các bước thực hiện:**
    1. Lấy gói dịch vụ đang hoạt động của công ty.
    2. Đếm tổng số tin đăng đang có trạng thái `published` của công ty đó (`Job.objects.filter(company=company, status='published').count()`).
    3. Kiểm tra: Nếu `count >= subscription.plan.max_job_posts`, ném ra lỗi `serializers.ValidationError` hoặc `ValueError` với thông báo phù hợp.
    4. Lưu ý: Cho phép tạo tin ở trạng thái `draft` (nháp) nhưng cần chặn lúc chuyển sang `published`.

## 3. Giới hạn Đẩy Top / Tin nổi bật (Job Featured Limit)
Kiểm soát số lượng tin được đánh dấu là `featured` dựa trên quota của gói.
- **Tập tin:** `backend/apps/recruitment/jobs/services/jobs.py`
- **Hàm cần sửa:** `set_job_featured`
- **Các bước thực hiện:**
    1. Khi tham số `featured` là `True`, thực hiện kiểm tra quota.
    2. Lấy gói dịch vụ đang hoạt động.
    3. Đếm số lượng tin của công ty đang có `featured=True`.
    4. So sánh với `subscription.plan.max_featured_jobs`.
    5. Nếu vượt giới hạn, chặn thao tác và báo lỗi cho người dùng.

## 4. Xử lý Trạng thái khi Gói hết hạn (Automation - Tùy chọn)
- **Nghiệm vụ:** Tạo một Celery task chạy định kỳ (Daily) để:
    - Quét các `CompanySubscription` đã quá `end_date`.
    - Chuyển `status` sang `expired`.
    - (Nâng cao) Tự động gỡ nhãn `featured` của các tin thuộc công ty đó nếu gói không còn hiệu lực.

## Tham chiếu Database
- **Plan Limits:** `SubscriptionPlan` (trường `max_job_posts`, `max_featured_jobs`).
- **Job Status:** `Job` (trường `status`, `featured`, `featured_until`).
- **Subscription Status:** `CompanySubscription` (trường `status`, `end_date`).
