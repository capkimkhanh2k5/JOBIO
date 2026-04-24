 **mô hình chuẩn : multi-auth + account linking**. Đi thẳng vào logic đúng:

---

## 1. Bản chất hệ thống của bạn


👉 **Google + account/password = 2 cách đăng nhập cùng 1 user**

---

## 2. Logic đúng cần đảm bảo

### Khi login bằng Google

* Nếu email chưa tồn tại → tạo user
* Nếu email đã tồn tại: -> login bình thường

---

### Khi login bằng account/password

* Chỉ cho login nếu:

  * `password_hash != null`

---

## 3. Quy tắc UI/UX chuẩn

### Trường hợp user có:

#### (A) Chỉ Google

* Hiển thị:

  * ✅ “Set password”
  * ❌ “Change password”

#### (B) Account + password 

* Hiển thị:

  * ✅ “Change password”
  * ✅ “Login bằng Google hoặc Email”

---

## 4. Flow đúng cho “Set password”

Không dùng "quên mật khẩu", mà tách riêng:

* User login bằng Google
* Bấm **Set password**
* Gửi email verify (hoặc yêu cầu re-auth Google)
* Nhập password mới
* Lưu `password_hash`

---

## 5. Flow “Quên mật khẩu” (chỉ khi đã có password)

* Nhập email
* Gửi reset link
* Set password mới

---

## 6. Lỗi phổ biến bạn cần tránh

* ❌ Dựa hoàn toàn vào email để auto-link mà không verify
  → có thể bị takeover account
* ❌ Không tách `Set password` vs `Reset password`
* ❌ Cho đổi mật khẩu khi `password = null`

---
