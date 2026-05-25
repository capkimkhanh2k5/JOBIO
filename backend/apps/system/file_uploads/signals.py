import logging

from django.db import transaction
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver

from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.company.company_media.models import CompanyMedia
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.blog.models import Post
from apps.system.file_uploads.models import FileUpload

logger = logging.getLogger(__name__)


IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "svg"}
VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "webm", "mkv"}


def schedule_cloudinary_delete(file_url: str, resource_type: str = "image") -> None:
    if not file_url or "res.cloudinary.com" not in str(file_url):
        return

    transaction.on_commit(lambda: _dispatch_cloudinary_delete(file_url, resource_type))


def _dispatch_cloudinary_delete(file_url: str, resource_type: str) -> None:
    try:
        from apps.system.file_uploads.tasks import delete_cloudinary_file_task

        delete_cloudinary_file_task.delay(file_url, resource_type)
    except Exception as exc:
        logger.warning(
            "Could not dispatch Cloudinary cleanup task; running inline url=%s "
            "resource_type=%s error=%s",
            file_url,
            resource_type,
            exc,
        )
        from .cloudinary_utils import delete_cloudinary_file

        delete_cloudinary_file(file_url, resource_type)


def _resource_type_from_extension(file_type: str | None) -> str:
    ext = str(file_type or "").lower().lstrip(".")
    if ext in IMAGE_EXTENSIONS:
        return "image"
    if ext in VIDEO_EXTENSIONS:
        return "video"
    return "raw"


def _resource_type_from_media_type(media_type) -> str:
    return "video" if "video" in str(media_type or "").lower() else "image"


# -----------------------------------------------------------------------------
# CustomUser (avatar_url)
# -----------------------------------------------------------------------------
@receiver(pre_save, sender=CustomUser)
def delete_old_avatar_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if old_instance.avatar_url and old_instance.avatar_url != instance.avatar_url:
        schedule_cloudinary_delete(old_instance.avatar_url, "image")


@receiver(post_delete, sender=CustomUser)
def delete_avatar_on_delete(sender, instance, **kwargs):
    if instance.avatar_url:
        schedule_cloudinary_delete(instance.avatar_url, "image")


# -----------------------------------------------------------------------------
# Company (logo_url, banner_url)
# -----------------------------------------------------------------------------
@receiver(pre_save, sender=Company)
def delete_old_company_images_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if old_instance.logo_url and old_instance.logo_url != instance.logo_url:
        schedule_cloudinary_delete(old_instance.logo_url, "image")
    if old_instance.banner_url and old_instance.banner_url != instance.banner_url:
        schedule_cloudinary_delete(old_instance.banner_url, "image")


@receiver(post_delete, sender=Company)
def delete_company_images_on_delete(sender, instance, **kwargs):
    if instance.logo_url:
        schedule_cloudinary_delete(instance.logo_url, "image")
    if instance.banner_url:
        schedule_cloudinary_delete(instance.banner_url, "image")


# -----------------------------------------------------------------------------
# RecruiterCV (cv_url) - Resource type: raw
# -----------------------------------------------------------------------------
@receiver(pre_save, sender=RecruiterCV)
def delete_old_cv_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if old_instance.cv_url and old_instance.cv_url != instance.cv_url:
        schedule_cloudinary_delete(old_instance.cv_url, "raw")


@receiver(post_delete, sender=RecruiterCV)
def delete_cv_on_delete(sender, instance, **kwargs):
    if instance.cv_url:
        schedule_cloudinary_delete(instance.cv_url, "raw")


# -----------------------------------------------------------------------------
# Post (thumbnail)
# -----------------------------------------------------------------------------
@receiver(pre_save, sender=Post)
def delete_old_blog_thumbnail_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if old_instance.thumbnail and old_instance.thumbnail != instance.thumbnail:
        schedule_cloudinary_delete(old_instance.thumbnail, "image")


@receiver(post_delete, sender=Post)
def delete_blog_thumbnail_on_delete(sender, instance, **kwargs):
    if instance.thumbnail:
        schedule_cloudinary_delete(instance.thumbnail, "image")


# -----------------------------------------------------------------------------
# FileUpload (file_path)
# -----------------------------------------------------------------------------
@receiver(post_delete, sender=FileUpload)
def delete_file_upload_on_delete(sender, instance, **kwargs):
    if instance.file_path and "res.cloudinary.com" in instance.file_path:
        schedule_cloudinary_delete(
            instance.file_path, _resource_type_from_extension(instance.file_type)
        )


@receiver(pre_save, sender=FileUpload)
def delete_old_file_upload_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if (
        old_instance.file_path
        and old_instance.file_path != instance.file_path
        and "res.cloudinary.com" in old_instance.file_path
    ):
        schedule_cloudinary_delete(
            old_instance.file_path,
            _resource_type_from_extension(old_instance.file_type),
        )


# -----------------------------------------------------------------------------
# CompanyMedia (media_url)
# -----------------------------------------------------------------------------
@receiver(pre_save, sender=CompanyMedia)
def delete_old_company_media_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if old_instance.media_url and old_instance.media_url != instance.media_url:
        schedule_cloudinary_delete(
            old_instance.media_url,
            _resource_type_from_media_type(old_instance.media_type),
        )


@receiver(post_delete, sender=CompanyMedia)
def delete_company_media_on_delete(sender, instance, **kwargs):
    if instance.media_url:
        schedule_cloudinary_delete(
            instance.media_url,
            _resource_type_from_media_type(instance.media_type),
        )
