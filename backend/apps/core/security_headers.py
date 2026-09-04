from django.conf import settings


class SecurityHeadersMiddleware:
    """Add baseline browser security headers for API-rendered pages."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        csp = getattr(settings, "CONTENT_SECURITY_POLICY", "")
        if csp:
            response.setdefault("Content-Security-Policy", csp)
        response.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        response.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        return response
