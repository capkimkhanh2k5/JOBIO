import logging
import os
from urllib.parse import unquote, urlparse

import cloudinary.uploader
from django.conf import settings

logger = logging.getLogger(__name__)

VALID_RESOURCE_TYPES = {"image", "video", "raw"}


def delete_cloudinary_file(
    file_url: str, resource_type: str = "image", raise_on_error: bool = False
) -> bool:
    """
    Xóa file từ Cloudinary dựa trên URL.
    Tự động xử lý public_id cho các resource_type khác nhau.
    """
    public_ids = extract_cloudinary_public_id_candidates(file_url, resource_type)
    if not public_ids:
        return False

    last_error = None
    try:
        for public_id in public_ids:
            result = cloudinary.uploader.destroy(
                public_id, resource_type=resource_type, invalidate=True
            )
            logger.info(
                "Deleted Cloudinary file: %s (%s) -> %s",
                public_id,
                resource_type,
                result,
            )
            if result.get("result") == "ok":
                return True
    except Exception as e:
        last_error = e
        logger.error("Failed to delete Cloudinary file %s: %s", file_url, e)

    if last_error and raise_on_error:
        raise last_error
    if raise_on_error:
        logger.warning(
            "Cloudinary file was not deleted url=%s resource_type=%s public_ids=%s",
            file_url,
            resource_type,
            public_ids,
        )
        return False

    return False


def extract_cloudinary_public_id_candidates(
    file_url: str, resource_type: str = "image"
) -> list[str]:
    public_id = extract_cloudinary_public_id(file_url, resource_type)
    if not public_id:
        return []

    candidates = [public_id]

    if resource_type == "raw":
        dirname, _, filename = public_id.rpartition("/")
        stem, dot, _extension = filename.rpartition(".")
        if dot and stem:
            raw_public_id_without_extension = f"{dirname}/{stem}" if dirname else stem
            candidates.append(raw_public_id_without_extension)

    return list(dict.fromkeys(candidates))


def extract_cloudinary_public_id(file_url: str, resource_type: str = "image") -> str:
    if resource_type not in VALID_RESOURCE_TYPES:
        return ""

    parsed_url = urlparse(str(file_url or ""))
    if parsed_url.scheme != "https" or parsed_url.hostname != "res.cloudinary.com":
        return ""

    path_parts = [unquote(part) for part in parsed_url.path.split("/") if part]
    if len(path_parts) < 4:
        return ""

    configured_cloud = _configured_cloud_name()
    cloud_name = path_parts[0]
    if configured_cloud and cloud_name != configured_cloud:
        return ""

    if path_parts[1] != resource_type or path_parts[2] != "upload":
        return ""

    public_parts = _public_id_parts_after_upload(path_parts[3:])

    public_id = "/".join(public_parts)
    if not public_id:
        return ""

    if resource_type in {"image", "video"}:
        public_id = public_id.rsplit(".", 1)[0]

    return public_id


def _public_id_parts_after_upload(path_parts: list[str]) -> list[str]:
    for index, path_part in enumerate(path_parts):
        if path_part.startswith("v") and path_part[1:].isdigit():
            return path_parts[index + 1 :]
    return path_parts


def _configured_cloud_name() -> str:
    storage = getattr(settings, "CLOUDINARY_STORAGE", {}) or {}
    return storage.get("CLOUD_NAME") or os.getenv("CLOUDINARY_CLOUD_NAME") or ""
