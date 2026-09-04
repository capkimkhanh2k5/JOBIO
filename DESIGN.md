---
name: JOBIO
description: Hệ sinh thái tuyển dụng thông minh fullstack.
colors:
  primary: "oklch(0.50 0.14 175)"
  accent: "oklch(0.72 0.15 85)"
  background: "oklch(0.985 0.006 85)"
  neutral: "oklch(0.13 0.02 175)"
  border: "oklch(0.92 0.008 85)"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif"
    letterSpacing: "-0.015em"
    lineHeight: "1.2"
  body:
    fontFamily: "'Be Vietnam Pro', sans-serif"
rounded:
  md: "0.625rem"
  card: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
  card-editorial:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.card}"
---

# Design System: JOBIO

## Overview

**Creative North Star: "Editorial Luxury"**

Hệ thống mang âm hưởng sang trọng, tinh tế như một tạp chí doanh nghiệp cao cấp nhưng vẫn đảm bảo tính hiện đại, sắc bén của một nền tảng công nghệ. Giao diện ưu tiên sự rõ ràng, sử dụng các dải màu ấm (warm) kết hợp với các hiệu ứng kính (glass-effect) và noise/grain texture để tạo chiều sâu tự nhiên. Thiết kế không lạm dụng màu sắc mà kiềm chế để làm nổi bật thông tin B2B quan trọng.

**Key Characteristics:**
- Tinh tế, sang trọng và tập trung vào trải nghiệm đọc.
- Bề mặt ấm (warm off-white) kết hợp điểm nhấn vàng (gold) và xanh cổ vịt sâu (deep teal).
- Chiều sâu linh hoạt với hiệu ứng Glass-effect và shadow sâu ở các thành phần nổi bật.
- Cảm giác tương tác chạm rõ ràng (Tactile and confident) thông qua hiệu ứng từ tính (magnetic).

## Colors

Bảng màu mang đặc trưng của sự chuyên nghiệp, tin cậy với độ bão hòa được kiểm soát chặt chẽ.

### Primary
- **Deep Teal** (oklch(0.50 0.14 175)): Màu chủ đạo mang tính chuyên nghiệp, tin cậy. Dành cho các thành phần hành động chính, viền focus và văn bản nhấn mạnh.

### Secondary
- **Warm Gold** (oklch(0.72 0.15 85)): Màu điểm nhấn (accent), dùng cho các chi tiết nhỏ, gradient chữ, hoặc đường viền trang trí mang tính "Editorial".

### Neutral
- **Warm Off-White** (oklch(0.985 0.006 85)): Nền chính của ứng dụng, mang lại cảm giác thân thiện với mắt khi đọc văn bản dài (như CV).
- **Teal-Tinted Black** (oklch(0.13 0.02 175)): Màu văn bản chính, có độ tương phản cao nhưng không gắt như đen thuần, phảng phất sắc xanh để đồng bộ với màu Primary.
- **Warm Border** (oklch(0.92 0.008 85)): Màu viền tinh tế, phân tách các khu vực nội dung mà không gây nhiễu thị giác.

### Named Rules
**The One Voice Rule.** Màu Accent (Warm Gold) chỉ được sử dụng dưới 5% diện tích màn hình để duy trì tính quý hiếm và sang trọng.

## Typography

**Display Font:** Plus Jakarta Sans (với fallback Be Vietnam Pro)
**Body Font:** Be Vietnam Pro

**Character:** Sự kết hợp mang lại cảm giác hiện đại, cấu trúc tốt nhưng vẫn giữ được nét thanh lịch đặc trưng của văn bản in ấn nhờ Plus Jakarta Sans ở các tiêu đề lớn.

### Hierarchy
- **Display**: Dành cho các tiêu đề lớn ở trang chủ (Hero) hoặc Landing Page. Letter-spacing hơi khít (-0.015em).
- **Body**: Phục vụ hiển thị khối văn bản dài như chi tiết công việc, mô tả công ty. Đảm bảo line-height rộng rãi, đọc dễ dàng.

## Elevation & Depth

Kết hợp cả hai triết lý: Phẳng (Flat-By-Default) ở các thành phần cơ bản để tối ưu không gian, nhưng Xếp lớp (Layered) với Glass-effect và shadow sâu ở các thành phần nổi bật như Hero, Modal hoặc Card nội dung chính.

### Shadow Vocabulary
- **Ambient Shadow** (`box-shadow: 0 4px 16px -4px oklch(0 0 0 / 0.06)`): Tạo độ nổi nhẹ nhàng cho Card thông thường.
- **Deep Glass Shadow** (`box-shadow: 0 20px 40px -12px oklch(0 0 0 / 0.10)`): Dành cho các thành phần lơ lửng, tạo chiều sâu mạnh.

### Named Rules
**The Focused Depth Rule.** Shadow sâu chỉ xuất hiện ở các thành phần cần sự tập trung cao độ (Modal, Popover) hoặc khi người dùng tương tác (Hover).

## Shapes

Hệ thống hình khối ưu tiên các đường bo góc vừa phải (10px - 0.625rem cho button/input và 16px - 1rem cho card). Các yếu tố trang trí dạng hạt (noise/grain) và khối mờ (aurora orbs) được sử dụng làm nền để làm mềm mại các đường nét cứng cáp của bảng B2B.

## Components

### Buttons
- **Shape:** Bo góc vừa phải (0.625rem).
- **Primary:** Nền Deep Teal, chữ sáng.
- **Hover / Focus:** Mang tính chất "Magnetic", phản hồi chạm tự tin (scale nhẹ `1.03` khi hover, `0.97` khi active).

### Cards / Containers
- **Corner Style:** 1rem.
- **Background:** Trắng ấm (Warm off-white) hoặc kính mờ (Glass-effect).
- **Shadow Strategy:** Viền cực nhạt kết hợp shadow mềm mại, tăng cường shadow khi hover.

### Inputs / Fields
- **Style:** Phẳng, có viền `Warm Border`.
- **Focus:** Viền và Ring chuyển sang màu Deep Teal.

## Do's and Don'ts

### Do:
- **Do** sử dụng các thành phần trang trí (aurora orb, noise texture) ở cường độ cực kỳ thấp để tránh làm phân tâm nội dung chính.
- **Do** duy trì khoảng trắng (white-space) rộng rãi đặc trưng của phong cách Editorial.

### Don't:
- **Don't** lạm dụng màu Warm Gold cho các nút bấm chính (nút bấm chính luôn là Deep Teal).
- **Don't** sử dụng shadow gắt, đen tuyền. Luôn sử dụng shadow có độ trong suốt và nhòe cao.
