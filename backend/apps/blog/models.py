from django.db import models
from django.utils.text import slugify
from apps.core.models import TimeStampedModel
from django.utils.translation import gettext_lazy as _

class Category(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = _('Categories')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Tag(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Post(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        PUBLISHED = 'published', _('Published')
        ARCHIVED = 'archived', _('Archived')

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    author = models.ForeignKey(
        'core_users.CustomUser',
        on_delete=models.CASCADE,
        related_name='posts',
        db_index=True
    )
    company = models.ForeignKey(
        'company_companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts',
        verbose_name='Công ty',
        db_index=True
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posts',
        db_index=True
    )
    tags = models.ManyToManyField(
        Tag,
        related_name='posts',
        blank=True
    )
    summary = models.TextField(blank=True)
    content = models.TextField() # Rich text
    thumbnail = models.URLField(max_length=500, null=True, blank=True, verbose_name='Thumbnail URL')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    view_count = models.PositiveIntegerField(default=0)
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    
    # Flags
    is_featured = models.BooleanField(default=False, verbose_name='Bài viết nổi bật')

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
