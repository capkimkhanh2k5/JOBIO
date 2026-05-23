"""
CV Parser Service — PDF → Text → Structured JSON via Groq LLM.

Pipeline:
1. Extract text from PDF (PyMuPDF + OCR fallback for scanned/image-based PDFs)
2. Send text to Groq LLM with structured system prompt
3. Return validated JSON matching cv_data schema

Supports:
- Digital/text-based PDFs (fast path via PyMuPDF get_text)
- Scanned/image-based PDFs (OCR path via PyMuPDF's built-in Tesseract)
"""

import json
import logging
from typing import Optional

import fitz  # PyMuPDF
from groq import Groq

from django.conf import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Minimum text length to consider a page "has content" (not a scanned image)
MIN_PAGE_TEXT_LENGTH = 30

# Maximum characters to send to LLM (prevents token overflow)
MAX_TEXT_CHARS = 15_000

# System prompt — JSON schema mirrors build_cv_data_from_profile() output
CV_PARSING_SYSTEM_PROMPT = """Bạn là một chuyên gia phân tích CV/Resume. Nhiệm vụ của bạn là trích xuất thông tin từ CV dạng text thô và trả về JSON có cấu trúc chính xác theo schema bên dưới.

QUY TẮC:
1. Chỉ trích xuất thông tin CÓ trong CV, KHÔNG bịa ra thông tin.
2. Nếu một trường không tìm thấy, để giá trị mặc định (chuỗi rỗng "", mảng rỗng [], hoặc null cho number).
3. Skills phải được chuẩn hóa: viết đúng tên chính thức (ví dụ "JavaScript", "React.js", "Python", "Node.js").
4. Dates theo format ISO 8601 (YYYY-MM-DD). Nếu chỉ có tháng/năm thì dùng ngày 01 (ví dụ "2023-06-01"). Nếu không rõ ngày → null.
5. proficiency_level cho skills: ước lượng dựa trên context (years, project complexity). Nếu không rõ → "intermediate".
6. Trả về JSON DUY NHẤT, không kèm markdown, backticks, hay text nào khác.
7. Nếu CV viết bằng tiếng Việt, vẫn trích xuất bình thường.

JSON SCHEMA BẮT BUỘC:
{
  "personal": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "current_position": "string (vị trí/chức danh hiện tại hoặc gần nhất)",
    "bio": "string (mục tiêu nghề nghiệp / tóm tắt bản thân nếu có)",
    "years_of_experience": null
  },
  "location": {
    "city": "string",
    "country": "string"
  },
  "links": {
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "skills": [
    {
      "name": "string",
      "proficiency_level": "beginner|intermediate|advanced|expert",
      "years_of_experience": null
    }
  ],
  "education": [
    {
      "school_name": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_date": "YYYY-MM-DD | null",
      "end_date": "YYYY-MM-DD | null",
      "is_current": false,
      "description": "string"
    }
  ],
  "experience": [
    {
      "company_name": "string",
      "job_title": "string",
      "start_date": "YYYY-MM-DD | null",
      "end_date": "YYYY-MM-DD | null",
      "is_current": false,
      "description": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuing_organization": "string",
      "issue_date": "YYYY-MM-DD | null",
      "expiry_date": "YYYY-MM-DD | null",
      "credential_id": "",
      "credential_url": ""
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "project_url": "",
      "start_date": "YYYY-MM-DD | null",
      "end_date": "YYYY-MM-DD | null"
    }
  ],
  "languages": [
    {
      "name": "string",
      "proficiency_level": "basic|intermediate|advanced|native"
    }
  ]
}"""


# ---------------------------------------------------------------------------
# PDF Text Extraction (with OCR fallback)
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF bytes.

    Strategy:
    1. Try native text extraction (fast, for digital PDFs).
    2. For pages with insufficient text (scanned/image-based),
       fall back to PyMuPDF's built-in OCR (Tesseract).
    3. Combine all pages into a single text string.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []

    for page_num, page in enumerate(doc):
        # Attempt native text extraction first
        text = page.get_text("text").strip()

        if len(text) >= MIN_PAGE_TEXT_LENGTH:
            # Page has enough text content — digital PDF
            pages_text.append(text)
        else:
            # Likely a scanned/image page — try OCR
            ocr_text = _ocr_page(page, page_num)
            if ocr_text:
                pages_text.append(ocr_text)
            elif text:
                # Fallback: use whatever little text we got
                pages_text.append(text)

    doc.close()

    combined = "\n\n".join(pages_text).strip()

    # Truncate to prevent token overflow
    if len(combined) > MAX_TEXT_CHARS:
        combined = combined[:MAX_TEXT_CHARS]
        logger.info(
            f"CV text truncated from {len(combined)} to {MAX_TEXT_CHARS} characters"
        )

    return combined


def _ocr_page(page: fitz.Page, page_num: int) -> Optional[str]:
    """
    Attempt OCR on a single page using PyMuPDF's built-in Tesseract integration.

    PyMuPDF's page.get_textpage_ocr() is significantly faster than
    external pytesseract because it avoids image serialization overhead.

    Falls back gracefully if Tesseract is not installed.
    """
    try:
        # PyMuPDF internally uses Tesseract if available
        # language="vie+eng" supports both Vietnamese and English CVs
        tp = page.get_textpage_ocr(flags=fitz.TEXT_PRESERVE_WHITESPACE, language="vie+eng")
        ocr_text = page.get_text("text", textpage=tp).strip()

        if len(ocr_text) >= MIN_PAGE_TEXT_LENGTH:
            logger.debug(f"OCR extracted {len(ocr_text)} chars from page {page_num}")
            return ocr_text

        return None

    except RuntimeError as e:
        # Tesseract not installed — log once and skip OCR
        if "Tesseract" in str(e) or "tesseract" in str(e):
            logger.warning(
                f"Tesseract OCR not available (page {page_num}). "
                "Install tesseract-ocr for scanned PDF support: "
                "brew install tesseract tesseract-lang"
            )
        else:
            logger.error(f"OCR error on page {page_num}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected OCR error on page {page_num}: {e}")
        return None


# ---------------------------------------------------------------------------
# LLM Parsing via Groq
# ---------------------------------------------------------------------------

def parse_cv_with_llm(raw_text: str) -> dict:
    """
    Send raw CV text to Groq LLM and receive structured JSON.

    Uses openai/gpt-oss-120b (reasoning model) with json_object response format.
    Falls back to llama-3.3-70b-versatile if primary model fails.
    """
    if not raw_text or len(raw_text.strip()) < 50:
        logger.warning("CV text too short for LLM parsing (<%d chars)", len(raw_text))
        return {}

    groq_api_key = getattr(settings, "GROQ_API_KEY", "") or ""
    if not groq_api_key:
        logger.error("GROQ_API_KEY not configured in settings")
        return {}

    primary_model = getattr(settings, "GROQ_CV_PARSER_MODEL", "openai/gpt-oss-120b")
    fallback_model = getattr(settings, "GROQ_CV_PARSER_FALLBACK_MODEL", "llama-3.3-70b-versatile")

    # Try primary model first, then fallback
    for model_name in [primary_model, fallback_model]:
        result = _call_groq(groq_api_key, model_name, raw_text)
        if result:
            logger.info(f"CV parsed successfully with model={model_name}")
            return result
        logger.warning(f"Model {model_name} failed, trying next...")

    logger.error("All Groq models failed for CV parsing")
    return {}


def _call_groq(api_key: str, model: str, raw_text: str) -> Optional[dict]:
    """
    Make a single Groq API call for CV parsing.
    Returns parsed dict or None on failure.
    """
    try:
        client = Groq(api_key=api_key)

        # Build messages
        messages = [
            {"role": "system", "content": CV_PARSING_SYSTEM_PROMPT},
            {"role": "user", "content": f"Phân tích CV sau và trích xuất thông tin:\n\n{raw_text}"},
        ]

        # Build completion kwargs — gpt-oss-120b is a reasoning model
        # and uses different parameters than standard models
        is_reasoning_model = "gpt-oss" in model

        kwargs = {
            "model": model,
            "messages": messages,
            "max_completion_tokens": 4096,
            "stream": False,
        }

        if is_reasoning_model:
            # Reasoning model: use reasoning_effort instead of temperature
            kwargs["reasoning_effort"] = "low"
            kwargs["response_format"] = {"type": "json_object"}
        else:
            # Standard model: use temperature and JSON mode
            kwargs["temperature"] = 0.1
            kwargs["response_format"] = {"type": "json_object"}

        completion = client.chat.completions.create(**kwargs)
        content = completion.choices[0].message.content

        if not content:
            logger.warning(f"Empty response from Groq model={model}")
            return None

        # Parse JSON response
        parsed = json.loads(content)

        if not isinstance(parsed, dict):
            logger.warning(f"Groq response is not a dict: {type(parsed)}")
            return None

        # Basic validation: ensure at least personal section exists
        if "personal" not in parsed and "skills" not in parsed:
            logger.warning(f"Groq response missing key sections (model={model})")
            return None

        return _normalize_parsed_data(parsed)

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from Groq (model={model}): {e}")
        return None
    except Exception as e:
        logger.error(f"Groq API error (model={model}): {e}")
        return None


def _normalize_parsed_data(data: dict) -> dict:
    """
    Ensure parsed data conforms to expected schema with proper defaults.
    Fills in missing sections with empty defaults.
    """
    # Ensure all top-level sections exist
    defaults = {
        "personal": {
            "full_name": "",
            "email": "",
            "phone": "",
            "current_position": "",
            "bio": "",
            "years_of_experience": None,
        },
        "location": {"city": "", "country": ""},
        "links": {"linkedin": "", "github": "", "portfolio": ""},
        "skills": [],
        "education": [],
        "experience": [],
        "certifications": [],
        "projects": [],
        "languages": [],
    }

    for key, default_value in defaults.items():
        if key not in data:
            data[key] = default_value
        elif isinstance(default_value, dict) and isinstance(data[key], dict):
            # Merge missing sub-keys
            for sub_key, sub_default in default_value.items():
                if sub_key not in data[key]:
                    data[key][sub_key] = sub_default

    # Normalize skills: ensure each skill has required fields
    if isinstance(data.get("skills"), list):
        normalized_skills = []
        for skill in data["skills"]:
            if isinstance(skill, dict) and skill.get("name"):
                normalized_skills.append({
                    "name": str(skill.get("name", "")),
                    "proficiency_level": str(skill.get("proficiency_level", "intermediate")),
                    "years_of_experience": skill.get("years_of_experience"),
                })
            elif isinstance(skill, str) and skill.strip():
                normalized_skills.append({
                    "name": skill.strip(),
                    "proficiency_level": "intermediate",
                    "years_of_experience": None,
                })
        data["skills"] = normalized_skills

    return data


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def process_cv_pdf(file_bytes: bytes) -> dict:
    """
    Main pipeline: PDF bytes → Structured cv_data dict.

    Returns:
        dict: Structured CV data matching cv_data schema.
              Returns empty dict {} if extraction/parsing fails.
    """
    # Step 1: Extract text from PDF
    try:
        raw_text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return {}

    if not raw_text.strip():
        logger.warning(
            "No text extracted from PDF. "
            "File may be image-only without OCR support, or corrupted."
        )
        return {}

    logger.info(f"Extracted {len(raw_text)} characters from PDF")

    # Step 2: Parse with LLM
    cv_data = parse_cv_with_llm(raw_text)

    if cv_data:
        skill_count = len(cv_data.get("skills", []))
        exp_count = len(cv_data.get("experience", []))
        logger.info(
            f"CV parsed successfully: "
            f"{skill_count} skills, {exp_count} experiences extracted"
        )
    else:
        logger.warning("LLM parsing returned empty result")

    return cv_data
