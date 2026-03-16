# Frontend - Job Portal Web App (React + Vite + TypeScript)

Tài liệu này dành riêng cho team Frontend.

## 1. Tổng quan

Frontend được xây bằng React + Vite + TypeScript, giao tiếp với Backend Django thông qua REST API.

Các thư viện chính:
- React 19
- React Router 7
- TanStack Query
- Axios
- React Hook Form + Zod
- Tailwind CSS 4

## 2. Yêu cầu

- Node.js 22+
- npm

## 3. Chạy local

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend local mặc định: http://localhost:5173

## 4. Chạy bằng Docker (từ root project)

```bash
docker compose up --build frontend
```

Frontend docker mapping: http://localhost:4000

## 5. Environment variables

File: `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=
```

Nếu gọi backend qua Docker Compose port mapping, dùng:

```env
VITE_API_BASE_URL=http://localhost:9000
```

## 6. Scripts

```bash
# dev server
npm run dev

# lint
npm run lint

# build production
npm run build

# preview production build
npm run preview
```

## 7. Cấu trúc chính

```text
frontend/
	src/
		components/
		pages/
		services/     # API clients
		store/        # state management
	public/
	index.html
	vite.config.ts
```

## 8. API integration

Axios instance được cấu hình ở `src/services/api.ts`:
- Đọc base URL từ `VITE_API_BASE_URL`
- Tự động gắn `Authorization: Bearer <token>`
- Tự động refresh token khi gặp 401

Token đang được lưu trong localStorage với key `jobio-user-storage`.

## 9. Error handling

- Global handling cho mutation errors qua TanStack Query trong `src/main.tsx`
- Error UI fallback có trong `components/shared/ErrorBoundary.tsx`

## 10. Troubleshooting

- FE gọi sai API host:
	- Kiểm tra `VITE_API_BASE_URL` có đúng với cổng backend đang chạy.
- Refresh token không hoạt động:
	- Kiểm tra endpoint backend `/api/token/refresh/`.
	- Kiểm tra dữ liệu auth trong localStorage.
- Lỗi Google OAuth:
	- Kiểm tra `VITE_GOOGLE_CLIENT_ID` có được set.

## 11. Tài liệu tham khảo

- React docs: https://react.dev/
- Vite docs: https://vite.dev/guide/
- React Router docs: https://reactrouter.com/
- TanStack Query docs: https://tanstack.com/query/latest
- Tailwind docs: https://tailwindcss.com/docs
