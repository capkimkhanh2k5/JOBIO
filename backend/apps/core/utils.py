import re
import unicodedata
from django.utils.text import slugify as django_slugify

def remove_accents(input_str):
    if not input_str:
        return ""
    # Normalize to NFD to separate accents
    nfd_form = unicodedata.normalize('NFD', input_str)
    # Filter out Mn category (Non-spacing Mark / Accents)
    res = "".join([c for c in nfd_form if unicodedata.category(c) != 'Mn'])
    # Manual fix for 'đ' and 'Đ'
    res = res.replace('đ', 'd').replace('Đ', 'D')
    return res

def slugify_vietnamese(text):
    if not text:
        return ""
    # Remove accents first
    text = remove_accents(text)
    # Then use Django's slugify for the rest
    return django_slugify(text)
