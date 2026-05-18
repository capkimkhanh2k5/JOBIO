import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from ..models import FileUpload


def save_upload(user, file_obj, entity_type=None, entity_id=None, is_public=False) -> FileUpload:
    """
        Lưu file đã tải lên Cloudinary (nếu có config) hoặc local storage.
    """
    ext = os.path.splitext(file_obj.name)[1].lower()
    unique_name = f"{uuid.uuid4()}{ext}"
    sub_folder = 'public' if is_public else 'private'

    file_url = None
    
    # Try Cloudinary first
    cloudinary_cloud_name = getattr(settings, 'CLOUDINARY_STORAGE', {}).get('CLOUD_NAME')
    if cloudinary_cloud_name:
        try:
            import cloudinary.uploader
            image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
            resource_type = 'image' if ext in image_exts else 'raw'
            public_id = f"Jobio/Uploads/{sub_folder}/{unique_name}"
            result = cloudinary.uploader.upload(
                file_obj,
                public_id=public_id,
                resource_type=resource_type,
                overwrite=False
            )
            file_url = result['secure_url']
            saved_path = public_id
        except Exception:
            # Fallback on error
            file_url = None

    if file_url is None:
        # Fallback: use Django default_storage (local or Cloudinary via django-cloudinary-storage)
        file_path = f"uploads/{sub_folder}/{unique_name}"
        saved_path = default_storage.save(file_path, ContentFile(file_obj.read()))
        try:
            file_url = default_storage.url(saved_path)
        except Exception:
            file_url = saved_path

    upload = FileUpload.objects.create(
        user=user,
        file_name=unique_name,
        original_name=file_obj.name,
        file_path=file_url,
        file_type=ext.replace('.', ''),
        file_size=file_obj.size,
        mime_type=file_obj.content_type,
        entity_type=entity_type,
        entity_id=entity_id,
        is_public=is_public
    )

    return upload
