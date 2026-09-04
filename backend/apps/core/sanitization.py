import re
from typing import Iterable, MutableMapping

from django.utils.html import strip_tags

BLOCKED_ELEMENT_RE = re.compile(
    r"<(script|style|iframe|object|embed|form)\b[^>]*>.*?</\1>",
    flags=re.IGNORECASE | re.DOTALL,
)

ALLOWED_HTML_TAGS = [
    "a",
    "b",
    "br",
    "code",
    "em",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "u",
    "ul",
]
ALLOWED_HTML_ATTRIBUTES = {"a": ["href", "rel", "target"]}
ALLOWED_HTML_PROTOCOLS = ["http", "https", "mailto"]


def sanitize_html(value: str | None) -> str | None:
    if value is None:
        return None

    text = BLOCKED_ELEMENT_RE.sub("", str(value))
    try:
        import bleach

        cleaned = bleach.clean(
            text,
            tags=ALLOWED_HTML_TAGS,
            attributes=ALLOWED_HTML_ATTRIBUTES,
            protocols=ALLOWED_HTML_PROTOCOLS,
            strip=True,
        )
        return bleach.linkify(cleaned, callbacks=[_safe_link_attrs])
    except ImportError:
        return strip_tags(text)


def sanitize_html_fields(
    attrs: MutableMapping[str, object], fields: Iterable[str]
) -> MutableMapping[str, object]:
    for field in fields:
        value = attrs.get(field)
        if isinstance(value, str):
            attrs[field] = sanitize_html(value)
    return attrs


def _safe_link_attrs(attrs, _new=False):
    href_key = (None, "href")
    href = attrs.get(href_key, "")
    if str(href).lower().startswith(("javascript:", "data:")):
        return None
    attrs[(None, "rel")] = "noopener noreferrer"
    attrs[(None, "target")] = "_blank"
    return attrs
