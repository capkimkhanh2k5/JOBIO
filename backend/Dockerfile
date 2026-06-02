FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt /app/

# Install system dependencies for WeasyPrint (PDF generation) and OCR fallback
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libjpeg-dev \
    zlib1g-dev \
    libffi-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-vie \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
