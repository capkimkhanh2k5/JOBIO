# Backend - Job Portal API (Django)

Tài liệu này dành riêng cho team Backend.

## 1. Tổng quan

Backend được xây bằng Django + Django REST Framework, cung cấp API cho hệ thống tuyển dụng.

Thành phần chính:
- Django REST API
- JWT Authentication (SimpleJWT)
- PostgreSQL
- Redis (cache, channels, celery)
- Celery worker (background jobs)
- Django Channels (real-time)

## 2. Yêu cầu

- Python 3.14 (theo Dockerfile)
- PostgreSQL 15+
- Redis 7+
- pip

## 3. Chạy local

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

Cập nhật file `.env` cho đúng DB/Redis local.

Chạy migration + server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

API local mặc định: http://localhost:8000

Trang admin: http://localhost:8000/admin

## 4. Chạy bằng Docker (từ root project)

```bash
docker compose up --build backend postgres redis
```

API docker mặc định (theo compose): http://localhost:9000

## 5. Biến môi trường

Bắt đầu từ `.env.example`.

Các nhóm biến quan trọng:
- Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- Django: `DEBUG`, `SECRET_KEY`
- Redis/Celery: `REDIS_HOST`, `REDIS_CACHE_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- AI: `OPENAI_API_KEY`, `GEMINI_API_KEY`
- Email SMTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- Upload media (optional): Cloudinary vars
- Thanh toán (optional): VNPay vars
- Passkey/WebAuthn: `WEBAUTHN_*`

Lưu ý host:
- Local: `DB_HOST=localhost`, Redis host `localhost`
- Docker Compose: `DB_HOST=postgres`, Redis host `redis`

## 6. Cấu trúc chính

```text
backend/
  apps/         # business modules
  config/       # settings, urls, asgi/wsgi, celery
  scripts/      # utility scripts
  templates/    # email/cv templates
  manage.py
```

Các module domain chính nằm trong `apps/`:
- core, company, recruitment, candidate, assessment
- communication, social, billing, email, blog, geography, system, analytics

## 7. API routes

Root URL config: `config/urls.py`

Pattern chung:
- Prefix đa số là `/api/...`
- JWT endpoints:
  - `POST /api/token/`
  - `POST /api/token/refresh/`

Tài liệu nội bộ API:
- `docs/API/API.md`

## 8. Background worker

Chạy Celery worker:

```bash
cd backend
source .venv/bin/activate
celery -A config worker -l info
```

Celery đọc cấu hình từ `config/celery.py` và settings có namespace `CELERY_*`.

## 9. Real-time (Channels)

Project có `ASGI_APPLICATION` và `CHANNEL_LAYERS` dùng Redis.

Khi cần chạy ASGI server production-like có thể dùng Daphne/Uvicorn (tuỳ hạ tầng).

## 10. Test

Chạy test:

```bash
cd backend
source .venv/bin/activate
pytest
```

`pytest.ini` đang dùng `config.settings_test` để chạy test nhẹ với SQLite in-memory.

## 11. Lệnh thường dùng

```bash
# tạo superuser
python manage.py createsuperuser

# collect static (khi cần deploy)
python manage.py collectstatic --noinput

# kiểm tra deploy checklist (production)
python manage.py check --deploy
```

## 12. Troubleshooting

- Không connect DB:
  - Kiểm tra `DB_HOST`, `DB_PORT`, credential PostgreSQL.
- Celery không nhận task:
  - Kiểm tra Redis chạy và `CELERY_BROKER_URL` đúng.
- Token refresh lỗi 401:
  - Kiểm tra endpoint `/api/token/refresh/` và refresh token còn hạn.
- Lỗi CORS từ frontend:
  - Kiểm tra `CORS_ALLOWED_ORIGINS` trong settings.

## 13. Tài liệu tham khảo

- Django docs: https://docs.djangoproject.com/en/5.2/
- DRF docs: https://www.django-rest-framework.org/
- Celery docs: https://docs.celeryq.dev/
- Django Channels docs: https://channels.readthedocs.io/
