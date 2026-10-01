from django.test import SimpleTestCase

from apps.core.sanitization import sanitize_html


class SanitizationTests(SimpleTestCase):
    def test_sanitize_html_removes_script_and_unsafe_urls(self):
        cleaned = sanitize_html(
            '<script>alert(1)</script><p onclick="alert(2)">Hello</p>'
            '<a href="javascript:alert(3)">bad</a>'
        )

        self.assertNotIn("<script", cleaned.lower())
        self.assertNotIn("onclick", cleaned.lower())
        self.assertNotIn("javascript:", cleaned.lower())
        self.assertIn("Hello", cleaned)
