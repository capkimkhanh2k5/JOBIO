# Job Portal - Fullstack (Django + React)

README này tổng hợp hướng dẫn chạy dự án Backend + Frontend theo 2 cách:
- Local development (khuyên dùng để debug nhanh)
- Docker Compose (khuyên dùng để đồng bộ môi trường)

## 1. Tổng quan

Project là hệ thống tuyển dụng gồm:
- Backend: Django REST API, JWT auth, PostgreSQL, Redis, Celery, Channels (real-time)
- Frontend: React + Vite + TypeScript
- Hỗ trợ thêm: Cloudinary, Google OAuth, VNPay, AI integrations (OpenAI/Gemini)

## 2. Tech Stack

- Python, Django, DRF, SimpleJWT
- PostgreSQL, Redis
- Celery, Django Channels
- React, Vite, TypeScript, Axios, TanStack Query
- Docker, Docker Compose

## 3. Cấu trúc thư mục chính

```text
backend/        Django API server
frontend/       React + Vite client app
docs/           Tài liệu nội bộ (API/DB/plan)
docker-compose.yml
README.md
```

## 4. Yêu cầu môi trường

- Docker Desktop + Docker Compose (nếu chạy bằng container)
- Python 3.14 (khớp Dockerfile backend)
- Node.js 22+ (khớp Dockerfile frontend)
- npm

## 5. Chạy nhanh bằng Docker Compose

Từ thư mục root project:

```bash
docker compose up --build
```

Services mặc định:
- Backend: http://localhost:9000
- Frontend: http://localhost:4000
- PostgreSQL: localhost:5433
- pgAdmin: http://localhost:5050
- Redis: localhost:6379

Thông tin đăng nhập pgAdmin mặc định:
- Email: [EMAIL_ADDRESS]
- Password: [PASSWORD]

Kết nối PostgreSQL từ pgAdmin:
- Host: postgres
- Port: 5432
- Database: jobportal_db
- Username: postgres
- Password: postgres

Dừng services:

```bash
docker compose down
```

Xóa luôn volume DB/Redis:

```bash
docker compose down -v
```

## 6. Chạy local (không Docker)

### 6.1 Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Backend local mặc định: http://localhost:8000

Tạo tài khoản admin:

```bash
python manage.py createsuperuser
```

### 6.2 Frontend

Mở terminal khác:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend local mặc định: http://localhost:5173

## 7. Biến môi trường

### 7.1 Backend (`backend/.env`)

Có thể bắt đầu từ `backend/.env.example`, sau đó bổ sung thêm các biến cần thiết theo chức năng.

Biến chính:

```env
# Database
DB_NAME=jobportal_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432

# Django
DEBUG=1
SECRET_KEY=django-insecure-change-me-in-production

# AI
OPENAI_API_KEY=
GEMINI_API_KEY=

# Redis/Celery
REDIS_HOST=localhost
REDIS_CACHE_URL=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# VNPay (optional)
VNP_TMN_CODE=
VNP_HASH_SECRET=
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_QUERY_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=http://localhost:3000/billing/payment-return

# WebAuthn / Passkey
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=JobPortal
WEBAUTHN_ORIGIN=http://localhost:4000
```

Ghi chú:
- Nếu chạy Docker Compose thì `DB_HOST=postgres`, Redis host thường là `redis`.
- Nếu chạy local thì dùng `localhost` tương ứng.

### 7.2 Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Nếu frontend gọi backend từ Docker port mapping thì có thể dùng:

```env
VITE_API_BASE_URL=http://localhost:9000
```

## 8. Lệnh hữu ích

### Backend

```bash
cd backend

# migrate
python manage.py makemigrations
python manage.py migrate

# test
pytest

# chạy celery worker
celery -A config worker -l info
```

### Frontend

```bash
cd frontend

# development
npm run dev

# lint
npm run lint

# build production
npm run build

# preview build
npm run preview
```

## 9. API & tài liệu nội bộ

- Tổng hợp API nội bộ: `docs/API/API.md`
- Tài liệu DB: `docs/DataBase/database.md`
- Kế hoạch module/chức năng: `docs/PLAN/`

## 9.1 README chuyên biệt

- Backend guide: `backend/README.md`
- Frontend guide: `frontend/README.md`

## 10. Troubleshooting nhanh

- Lỗi frontend không gọi được backend:
	- Kiểm tra `VITE_API_BASE_URL`
	- Kiểm tra cổng backend (`8000` local, `9000` docker)
- Lỗi database connection:
	- Kiểm tra `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- Lỗi Celery pending mãi:
	- Kiểm tra Redis có chạy không
	- Kiểm tra `CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND`
- Lỗi CORS:
	- Đảm bảo frontend chạy ở origin có trong `CORS_ALLOWED_ORIGINS`

## 11. Tài liệu tham khảo chính thức

- Django installation: https://docs.djangoproject.com/en/5.2/intro/install/
- Django deployment checklist: https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/
- Vite guide: https://vite.dev/guide/
- Docker Compose docs: https://docs.docker.com/compose/
- Celery first steps: https://docs.celeryq.dev/en/stable/getting-started/first-steps-with-celery.html
- React Router docs: https://reactrouter.com/

---
