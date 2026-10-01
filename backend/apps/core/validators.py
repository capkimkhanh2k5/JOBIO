from urllib.parse import urlparse

from rest_framework import serializers


def validate_https_url(value):
    if value in (None, ""):
        return value

    scheme = urlparse(str(value)).scheme.lower()
    if scheme != "https":
        raise serializers.ValidationError("URL must use https.")
    return value


def validate_https_url_fields(attrs, fields):
    for field in fields:
        if field in attrs:
            attrs[field] = validate_https_url(attrs[field])
    return attrs
