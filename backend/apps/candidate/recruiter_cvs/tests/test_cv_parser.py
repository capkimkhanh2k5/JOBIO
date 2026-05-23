"""
Unit tests for CV Parser Service (cv_parser.py).

Tests cover:
1. PDF text extraction (extract_text_from_pdf) — with real CV.pdf
2. Data normalization (_normalize_parsed_data) — schema validation
3. LLM parsing (parse_cv_with_llm) — mocked Groq API
4. Full pipeline (process_cv_pdf) — integration with real PDF
5. Edge cases — empty PDF, corrupted data, API failures
"""

import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

# Path to real test CV fixture
FIXTURES_DIR = Path(__file__).parent / "fixtures"
TEST_CV_PATH = FIXTURES_DIR / "test_cv.pdf"


def _load_test_cv_bytes() -> bytes:
    """Load the real test CV PDF as bytes."""
    with open(TEST_CV_PATH, "rb") as f:
        return f.read()


# ═══════════════════════════════════════════════════════════════════════════════
# 1. PDF Text Extraction Tests
# ═══════════════════════════════════════════════════════════════════════════════


class ExtractTextFromPdfTest(TestCase):
    """Test extract_text_from_pdf() with real CV.pdf fixture."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not TEST_CV_PATH.exists():
            raise FileNotFoundError(
                f"Test fixture not found: {TEST_CV_PATH}. "
                "Copy CV.pdf to tests/fixtures/test_cv.pdf"
            )
        cls.pdf_bytes = _load_test_cv_bytes()

    def test_extract_returns_non_empty_text(self):
        """PDF extraction should return substantial text from real CV."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertIsInstance(text, str)
        self.assertGreater(len(text), 200, "Extracted text should be substantial")

    def test_extract_contains_candidate_name(self):
        """Extracted text should contain the candidate's name."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertIn("PHU DOAN HOANG THIEN", text)

    def test_extract_contains_contact_info(self):
        """Extracted text should contain email and phone."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertIn("dhtphu05@gmail.com", text)
        self.assertIn("0385544194", text)

    def test_extract_contains_skills(self):
        """Extracted text should contain technical skills."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        # Key skills from the CV
        for skill in ["JavaScript", "TypeScript", "React Native", "NestJS", "PostgreSQL"]:
            self.assertIn(skill, text, f"Should contain skill: {skill}")

    def test_extract_contains_education(self):
        """Extracted text should contain education info."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertIn("University of Science and Technology", text)
        self.assertIn("Information Technology", text)

    def test_extract_contains_experience(self):
        """Extracted text should contain work experience."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertIn("OpenVerse", text)
        self.assertIn("Software Developer", text)

    def test_extract_contains_certifications(self):
        """Extracted text should contain certifications."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertIn("Agile Development and Scrum", text)
        self.assertIn("AWS Cloud Technical Essentials", text)

    def test_extract_truncates_long_text(self):
        """Text longer than MAX_TEXT_CHARS should be truncated."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            MAX_TEXT_CHARS,
            extract_text_from_pdf,
        )

        text = extract_text_from_pdf(self.pdf_bytes)

        self.assertLessEqual(len(text), MAX_TEXT_CHARS)

    def test_extract_empty_pdf_returns_empty(self):
        """Empty/minimal PDF should return empty string."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        # Create a minimal valid PDF with no text
        import fitz

        doc = fitz.open()
        doc.new_page()
        empty_bytes = doc.tobytes()
        doc.close()

        text = extract_text_from_pdf(empty_bytes)

        self.assertEqual(text.strip(), "")

    def test_extract_invalid_pdf_raises(self):
        """Invalid PDF bytes should raise an exception."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            extract_text_from_pdf,
        )

        with self.assertRaises(Exception):
            extract_text_from_pdf(b"not a real pdf file content")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Data Normalization Tests
# ═══════════════════════════════════════════════════════════════════════════════


class NormalizeParsedDataTest(TestCase):
    """Test _normalize_parsed_data() schema validation and defaults."""

    def test_fills_missing_sections(self):
        """Missing top-level sections should be filled with defaults."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        data = {"personal": {"full_name": "Test User"}}
        result = _normalize_parsed_data(data)

        # All sections should exist
        for key in ["personal", "location", "links", "skills", "education",
                     "experience", "certifications", "projects", "languages"]:
            self.assertIn(key, result, f"Missing section: {key}")

    def test_fills_missing_personal_subkeys(self):
        """Missing personal sub-keys should get defaults."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        data = {"personal": {"full_name": "Test"}}
        result = _normalize_parsed_data(data)

        self.assertEqual(result["personal"]["full_name"], "Test")
        self.assertEqual(result["personal"]["email"], "")
        self.assertEqual(result["personal"]["phone"], "")
        self.assertIsNone(result["personal"]["years_of_experience"])

    def test_normalizes_skill_dicts(self):
        """Skills as dicts should be normalized with required fields."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        data = {
            "skills": [
                {"name": "Python", "proficiency_level": "expert"},
                {"name": "React"},  # missing proficiency_level
            ]
        }
        result = _normalize_parsed_data(data)

        self.assertEqual(len(result["skills"]), 2)
        self.assertEqual(result["skills"][0]["name"], "Python")
        self.assertEqual(result["skills"][0]["proficiency_level"], "expert")
        self.assertEqual(result["skills"][1]["proficiency_level"], "intermediate")

    def test_normalizes_skill_strings(self):
        """Skills as plain strings should be wrapped into dicts."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        data = {"skills": ["Python", "JavaScript", "Docker"]}
        result = _normalize_parsed_data(data)

        self.assertEqual(len(result["skills"]), 3)
        for skill in result["skills"]:
            self.assertIn("name", skill)
            self.assertEqual(skill["proficiency_level"], "intermediate")
            self.assertIsNone(skill["years_of_experience"])

    def test_filters_empty_skill_names(self):
        """Skills with empty names should be filtered out."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        data = {
            "skills": [
                {"name": "Python"},
                {"name": ""},
                {"name": None},
                "",
                "  ",
            ]
        }
        result = _normalize_parsed_data(data)

        self.assertEqual(len(result["skills"]), 1)
        self.assertEqual(result["skills"][0]["name"], "Python")

    def test_preserves_existing_data(self):
        """Existing valid data should not be overwritten."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        data = {
            "personal": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "phone": "123456",
                "current_position": "Developer",
                "bio": "A bio",
                "years_of_experience": 5,
            },
            "skills": [{"name": "Python", "proficiency_level": "expert", "years_of_experience": 3}],
            "education": [{"school_name": "MIT"}],
        }
        result = _normalize_parsed_data(data)

        self.assertEqual(result["personal"]["full_name"], "John Doe")
        self.assertEqual(result["personal"]["years_of_experience"], 5)
        self.assertEqual(len(result["skills"]), 1)
        self.assertEqual(result["skills"][0]["years_of_experience"], 3)

    def test_handles_completely_empty_input(self):
        """Empty dict should get all default sections."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            _normalize_parsed_data,
        )

        result = _normalize_parsed_data({})

        self.assertIn("personal", result)
        self.assertEqual(result["personal"]["full_name"], "")
        self.assertEqual(result["skills"], [])
        self.assertEqual(result["education"], [])


# ═══════════════════════════════════════════════════════════════════════════════
# 3. LLM Parsing Tests (Mocked Groq)
# ═══════════════════════════════════════════════════════════════════════════════


@override_settings(
    GROQ_API_KEY="test-api-key",
    GROQ_CV_PARSER_MODEL="test-model",
    GROQ_CV_PARSER_FALLBACK_MODEL="test-fallback",
)
class ParseCvWithLlmTest(TestCase):
    """Test parse_cv_with_llm() with mocked Groq API."""

    MOCK_LLM_RESPONSE = json.dumps({
        "personal": {
            "full_name": "Phu Doan Hoang Thien",
            "email": "dhtphu05@gmail.com",
            "phone": "0385544194",
            "current_position": "Mobile Developer Intern",
            "bio": "Dedicated Software Engineering student",
            "years_of_experience": 1,
        },
        "location": {"city": "Danang", "country": "Vietnam"},
        "links": {
            "linkedin": "",
            "github": "https://github.com/dhtphu05",
            "portfolio": "",
        },
        "skills": [
            {"name": "JavaScript", "proficiency_level": "advanced", "years_of_experience": 2},
            {"name": "TypeScript", "proficiency_level": "advanced", "years_of_experience": 2},
            {"name": "React Native", "proficiency_level": "advanced", "years_of_experience": 1},
            {"name": "Next.js", "proficiency_level": "advanced", "years_of_experience": 1},
            {"name": "NestJS", "proficiency_level": "intermediate", "years_of_experience": 1},
            {"name": "PostgreSQL", "proficiency_level": "intermediate", "years_of_experience": 1},
            {"name": "Docker", "proficiency_level": "intermediate", "years_of_experience": 1},
        ],
        "education": [{
            "school_name": "University of Science and Technology – The University of Da Nang",
            "degree": "Bachelor",
            "field_of_study": "Information Technology",
            "start_date": "2023-09-01",
            "end_date": "2027-08-01",
            "is_current": True,
            "description": "GPA: 3.71/4.00, Major: Software Engineering",
        }],
        "experience": [{
            "company_name": "OpenVerse",
            "job_title": "Software Developer",
            "start_date": "2025-09-01",
            "end_date": "2026-03-01",
            "is_current": False,
            "description": "Full-stack Development for Spa SaaS",
        }],
        "certifications": [
            {"name": "Introduction to Agile Development and Scrum", "issuing_organization": "IBM", "issue_date": "2024-09-01", "expiry_date": None},
            {"name": "AWS Cloud Technical Essentials", "issuing_organization": "AWS", "issue_date": "2024-09-01", "expiry_date": None},
        ],
        "projects": [],
        "languages": [],
    })

    def _build_mock_completion(self, content: str):
        """Build a mock Groq completion response."""
        mock_message = MagicMock()
        mock_message.content = content

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        return mock_completion

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_success(self, MockGroq):
        """Successful LLM parsing should return structured data."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = (
            self._build_mock_completion(self.MOCK_LLM_RESPONSE)
        )
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertIsInstance(result, dict)
        self.assertEqual(result["personal"]["full_name"], "Phu Doan Hoang Thien")
        self.assertEqual(result["personal"]["email"], "dhtphu05@gmail.com")
        self.assertEqual(len(result["skills"]), 7)
        self.assertEqual(len(result["experience"]), 1)
        self.assertEqual(len(result["certifications"]), 2)

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_extracts_correct_position(self, MockGroq):
        """LLM should extract the correct current_position from CV."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = (
            self._build_mock_completion(self.MOCK_LLM_RESPONSE)
        )
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result["personal"]["current_position"], "Mobile Developer Intern")

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_returns_empty_on_short_text(self, MockGroq):
        """Text shorter than 50 chars should return empty dict."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        result = parse_cv_with_llm("Short")

        self.assertEqual(result, {})
        MockGroq.assert_not_called()

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_returns_empty_on_empty_text(self, MockGroq):
        """Empty text should return empty dict."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        result = parse_cv_with_llm("")

        self.assertEqual(result, {})

    @override_settings(GROQ_API_KEY="")
    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_returns_empty_when_no_api_key(self, MockGroq):
        """Missing GROQ_API_KEY should return empty dict."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_handles_invalid_json_response(self, MockGroq):
        """Invalid JSON from LLM should return empty dict (graceful fallback)."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        # Both primary and fallback return invalid JSON
        mock_client.chat.completions.create.return_value = (
            self._build_mock_completion("This is not valid JSON at all!")
        )
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_handles_api_exception(self, MockGroq):
        """Groq API exception should return empty dict (graceful fallback)."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error 500")
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_handles_empty_response(self, MockGroq):
        """Empty content from LLM should return empty dict."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = (
            self._build_mock_completion("")
        )
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_rejects_non_dict_response(self, MockGroq):
        """Response that isn't a dict (e.g., list) should be rejected."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = (
            self._build_mock_completion('[{"name": "test"}]')
        )
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_rejects_missing_key_sections(self, MockGroq):
        """Response without 'personal' or 'skills' sections should be rejected."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = (
            self._build_mock_completion('{"random_key": "random_value"}')
        )
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_parse_fallback_model_on_primary_failure(self, MockGroq):
        """If primary model fails, should try fallback model."""
        from apps.candidate.recruiter_cvs.services.cv_parser import (
            parse_cv_with_llm,
        )

        mock_client = MagicMock()
        # First call (primary model) fails, second call (fallback) succeeds
        mock_client.chat.completions.create.side_effect = [
            Exception("Primary model error"),
            self._build_mock_completion(self.MOCK_LLM_RESPONSE),
        ]
        MockGroq.return_value = mock_client

        result = parse_cv_with_llm("Some CV text content here that is long enough")

        self.assertIsInstance(result, dict)
        self.assertEqual(result["personal"]["full_name"], "Phu Doan Hoang Thien")
        # Groq client should have been called twice (primary + fallback)
        self.assertEqual(mock_client.chat.completions.create.call_count, 2)


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Full Pipeline Tests
# ═══════════════════════════════════════════════════════════════════════════════


@override_settings(
    GROQ_API_KEY="test-api-key",
    GROQ_CV_PARSER_MODEL="test-model",
    GROQ_CV_PARSER_FALLBACK_MODEL="test-fallback",
)
class ProcessCvPdfTest(TestCase):
    """Test process_cv_pdf() — full pipeline from PDF to structured data."""

    MOCK_LLM_RESPONSE = json.dumps({
        "personal": {
            "full_name": "Phu Doan Hoang Thien",
            "email": "dhtphu05@gmail.com",
            "phone": "0385544194",
            "current_position": "Mobile Developer Intern",
            "bio": "",
            "years_of_experience": None,
        },
        "skills": [
            {"name": "JavaScript", "proficiency_level": "advanced"},
            {"name": "TypeScript", "proficiency_level": "advanced"},
            {"name": "React Native", "proficiency_level": "advanced"},
        ],
        "education": [{"school_name": "DUT", "degree": "Bachelor", "field_of_study": "IT", "start_date": None, "end_date": None, "is_current": True, "description": ""}],
        "experience": [{"company_name": "OpenVerse", "job_title": "Software Developer", "start_date": None, "end_date": None, "is_current": False, "description": ""}],
        "certifications": [],
        "projects": [],
        "languages": [],
    })

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not TEST_CV_PATH.exists():
            raise FileNotFoundError(f"Test fixture not found: {TEST_CV_PATH}")
        cls.pdf_bytes = _load_test_cv_bytes()

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_full_pipeline_success(self, MockGroq):
        """Full pipeline: real PDF → extract → mock LLM → structured output."""
        from apps.candidate.recruiter_cvs.services.cv_parser import process_cv_pdf

        mock_message = MagicMock()
        mock_message.content = self.MOCK_LLM_RESPONSE
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_completion
        MockGroq.return_value = mock_client

        result = process_cv_pdf(self.pdf_bytes)

        # Should return valid structured data
        self.assertIsInstance(result, dict)
        self.assertIn("personal", result)
        self.assertIn("skills", result)
        self.assertEqual(result["personal"]["full_name"], "Phu Doan Hoang Thien")
        self.assertEqual(len(result["skills"]), 3)

        # Verify Groq was called with the extracted text
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs.get("messages") or call_args[1].get("messages")
        user_message = messages[1]["content"]
        self.assertIn("PHU DOAN HOANG THIEN", user_message)

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_full_pipeline_llm_failure_returns_empty(self, MockGroq):
        """If LLM fails, pipeline should return empty dict."""
        from apps.candidate.recruiter_cvs.services.cv_parser import process_cv_pdf

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("LLM down")
        MockGroq.return_value = mock_client

        result = process_cv_pdf(self.pdf_bytes)

        self.assertEqual(result, {})

    def test_full_pipeline_empty_pdf_returns_empty(self):
        """Empty PDF (no text) should return empty dict."""
        from apps.candidate.recruiter_cvs.services.cv_parser import process_cv_pdf
        import fitz

        doc = fitz.open()
        doc.new_page()
        empty_bytes = doc.tobytes()
        doc.close()

        result = process_cv_pdf(empty_bytes)

        self.assertEqual(result, {})

    def test_full_pipeline_invalid_pdf_returns_empty(self):
        """Corrupted PDF bytes should return empty dict (graceful)."""
        from apps.candidate.recruiter_cvs.services.cv_parser import process_cv_pdf

        result = process_cv_pdf(b"corrupted data here")

        self.assertEqual(result, {})

    @patch("apps.candidate.recruiter_cvs.services.cv_parser.Groq")
    def test_pipeline_output_compatible_with_scoring(self, MockGroq):
        """Pipeline output should be compatible with job scoring algorithm."""
        from apps.candidate.recruiter_cvs.services.cv_parser import process_cv_pdf

        mock_message = MagicMock()
        mock_message.content = self.MOCK_LLM_RESPONSE
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_completion
        MockGroq.return_value = mock_client

        cv_data = process_cv_pdf(self.pdf_bytes)

        # Verify cv_data structure matches what scoring algorithm expects:
        # 1. cv_data.personal.current_position (for title_similarity_score)
        personal = cv_data.get("personal", {})
        self.assertIsInstance(personal, dict)
        self.assertIn("current_position", personal)
        self.assertTrue(len(personal["current_position"]) > 0)

        # 2. cv_data.skills[].name (for _cv_skill_tokens)
        skills = cv_data.get("skills", [])
        self.assertIsInstance(skills, list)
        self.assertGreater(len(skills), 0)
        for skill in skills:
            self.assertIn("name", skill)
            self.assertIsInstance(skill["name"], str)
            self.assertTrue(len(skill["name"]) > 0)


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Integration with Job Scoring
# ═══════════════════════════════════════════════════════════════════════════════


class CvDataScoringIntegrationTest(TestCase):
    """Test that parsed cv_data works correctly with the scoring algorithm."""

    def test_cv_skill_tokens_from_parsed_data(self):
        """_cv_skill_tokens should extract tokens from parsed cv_data."""
        from apps.recruitment.jobs.selectors.jobs import _cv_skill_tokens

        cv_data = {
            "skills": [
                {"name": "JavaScript", "proficiency_level": "advanced"},
                {"name": "React Native", "proficiency_level": "intermediate"},
                {"name": "PostgreSQL", "proficiency_level": "intermediate"},
            ]
        }

        tokens = _cv_skill_tokens(cv_data)

        self.assertIn("javascript", tokens)
        self.assertIn("react", tokens)
        self.assertIn("native", tokens)
        self.assertIn("postgresql", tokens)

    def test_title_similarity_with_parsed_position(self):
        """_title_similarity_score should work with parsed current_position."""
        from apps.recruitment.jobs.selectors.jobs import _title_similarity_score

        # CV says "Mobile Developer Intern", job title is "Mobile Developer"
        score = _title_similarity_score("Mobile Developer Intern", "Mobile Developer")

        self.assertGreater(score, 0.5, "Partial match should have decent score")

    def test_title_similarity_exact_match(self):
        """Exact position match should have score 1.0."""
        from apps.recruitment.jobs.selectors.jobs import _title_similarity_score

        score = _title_similarity_score("Software Developer", "Software Developer")

        self.assertEqual(score, 1.0)

    def test_title_similarity_no_match(self):
        """Completely different titles should have low score."""
        from apps.recruitment.jobs.selectors.jobs import _title_similarity_score

        score = _title_similarity_score("Mobile Developer", "Marketing Manager")

        self.assertLess(score, 0.3)

    def test_is_cv_upload_with_parsed_data(self):
        """CV_Upload with parsed cv_data should NOT trigger fallback."""
        # Simulate what calculate_cv_job_match_score does for is_cv_upload check
        cv_data = {
            "personal": {"current_position": "Software Developer"},
            "skills": [{"name": "Python"}],
        }

        # The check: template is None AND cv_data is empty
        template = None
        is_cv_upload = template is None and not cv_data

        # With parsed data, is_cv_upload should be False!
        self.assertFalse(
            is_cv_upload,
            "CV with parsed cv_data should NOT be treated as CV_Upload fallback"
        )

    def test_is_cv_upload_without_parsed_data(self):
        """CV_Upload without parsed data should trigger fallback."""
        cv_data = {}
        template = None
        is_cv_upload = template is None and not cv_data

        self.assertTrue(
            is_cv_upload,
            "CV without cv_data should trigger recruiter profile fallback"
        )
