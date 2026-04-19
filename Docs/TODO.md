# TODO 1: interview_interviewers

CÂU TRẢ LỜI LÀ: CÓ THỂ LƯỢC BỎ.

Bởi vì:

Bạn đang xây dựng dự án giai đoạn đầu (MVP), các công ty thường chỉ dùng 1 tài khoản đại diện để phỏng vấn và ghi lại kết quả cuối cùng (Đậu/Rớt).
Việc chia ra làm hội đồng phỏng vấn (nhiều người cùng chấm điểm) là một tính năng rất nâng cao của các hệ thống ATS lớn, hiện tại nó làm phức tạp hóa quá trình code API của bạn.
Trong bảng interviews hiện tại của bạn đã có sẵn 2 cột feedback (nhận xét) và result (kết quả). Như vậy là đã ĐỦ để lưu kết quả của buổi phỏng vấn đó rồi.
✅ Giải pháp tôi đề xuất:

Xoá hoàn toàn bảng interview_interviewers để giải phóng bộ nhớ và giảm độ phức tạp.
Thêm cột interviewer_id (Liên kết với bảng Users) trực tiếp vào bảng interviews để lưu lại "Ai là người đã phỏng vấn ứng viên này".
Bạn có muốn tôi tiến hành viết script xoá bảng interview_interviewers và gộp cột cho bạn luôn không?

# TODO 2: reviews, review_reactions

1. Nhóm Bảng CHẮC CHẮN PHẢI XOÁ (Thuộc tính năng Review)
reviews: Bảng chứa nội dung bài đánh giá công ty (số sao, ưu/nhược điểm).
review_reactions: Bảng lưu lượt tương tác (Like / Thấy hữu ích) của người dùng đối với các bài review. 👉 Lợi ích khi xoá: Giảm bớt toàn bộ hệ thống API kiểm duyệt, duyệt bài, báo cáo vi phạm liên quan đến Review. Dashboard Admin cũng sẽ nhẹ đi rất nhiều.
2. Nhóm Bảng CÂN NHẮC XOÁ (Các tính năng Mạng xã hội "kiểu LinkedIn" bị dư thừa)
Tôi nhận thấy trong cấu trúc của bạn hiện tại đang có tham vọng xây dựng một mạng xã hội thu nhỏ (giống LinkedIn). Tuy nhiên, nếu bạn đã nói "không khả quan, chỉ làm blog thôi" thì các bảng sau đây hoàn toàn dư thừa, rất khó để kéo người dùng tương tác trong giai đoạn đầu:

recruiter_connections (Kết nối): Cho phép các ứng viên kết bạn, gửi lời mời kết nối với nhau.
recommendations (Đề xuất/Tiến cử): Người dùng này viết bài khen ngợi, tiến cử người dùng kia.
skill_endorsements (Xác nhận kỹ năng): Người dùng A bấm xác nhận Người dùng B rất giỏi kỹ năng "Python" hoặc "Marketing". 👉 Đề xuất: NÊN XOÁ CẢ 3 BẢNG NÀY. Hãy tập trung làm thật tốt luồng "Công ty đăng Job -> Ứng viên apply CV" trước. Việc nhồi nhét tính năng mạng xã hội lúc này sẽ làm phình to Database và Codebase không cần thiết.
3. Bảng NÊN GIỮ LẠI (Trong nhóm Social)
company_followers (Theo dõi công ty): Bảng này lưu việc ứng viên bấm Follow một công ty. 👉 Lý do giữ lại: Tính năng này rất thiết thực. Nó giúp ứng viên nhận được Email/Thông báo ngay lập tức khi Công ty yêu thích của họ đăng tin tuyển dụng mới. (Chúng ta có thể chuyển bảng này sang Module Company thay vì để ở Social).

# TODO 3: report

2. Nhóm DƯ THỪA & CHƯA ĐƯỢC TRIỂN KHAI (Nên xoá bỏ)
Các bảng này sinh ra dữ liệu khổng lồ (làm phình Database) nhưng hiện tại Frontend chưa hề có tính năng nào gọi đến chúng. Đối với một MVP (Sản phẩm giai đoạn đầu), bạn NÊN XOÁ để tối ưu:

analytics_generatedreport & analytics_reports: Hiện tại các con số thống kê ở trang Admin đang được API tính toán trực tiếp (On-the-fly) thông qua analyticsService.ts chứ không lưu cứng xuống 2 bảng này. Việc có 2 bảng này là dư thừa.
search_history & job_search_history: Lưu lại lịch sử tìm kiếm (giống Shopee hiển thị "Lịch sử tìm kiếm gần đây"). Tính năng này làm phình Database cực nhanh (Mỗi lần gõ tìm kiếm là sinh 1 dòng DB), mà Frontend hiện chưa triển khai hiển thị. Nên xoá.
faqs: Danh sách câu hỏi thường gặp. Thực tế trong giai đoạn đầu bạn chỉ cần code cứng HTML ở trang FAQ là đủ, không cần thiết phải tạo cả bảng Database và viết API quản lý cho nó tốn thời gian.
audit_logs: Bảng này lưu nhật ký thay đổi dữ liệu nhạy cảm. Hiện nó đang bị trùng lặp chức năng với nhóm số 3 bên dưới. Nên xoá để tránh dư thừa.
🟡 3. Nhóm CÂN NHẮC TẠM GIỮ LẠI (Nhật ký hoạt động)
activity_logs & activity_log_types: Bảng này lưu lại lịch sử "Ai đã click vào đâu, tải cái gì, lúc mấy giờ". Mặc dù Frontend Admin hiện chưa có màn hình hiển thị danh sách này, nhưng xét về góc độ bảo mật hệ thống, việc có 1 bảng Log để truy vết nếu có sự cố xảy ra là rất cần thiết. Nên giữ lại cặp này.