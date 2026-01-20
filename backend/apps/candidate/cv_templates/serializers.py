from rest_framework import serializers
from .models import CVTemplate
from apps.candidate.cv_template_categories.models import CVTemplateCategory


class CVTemplateCategorySerializer(serializers.ModelSerializer):
    """
    Serializer cho danh mục mẫu CV
    """
    
    template_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CVTemplateCategory
        fields = ['id', 'name', 'slug', 'description', 'template_count', 'is_active']
    
    def get_template_count(self, obj):
        return obj.templates.filter(is_active=True).count()


class CVTemplateListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách mẫu CV
    """
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    
    class Meta:
        model = CVTemplate
        fields = [
            'id', 'name', 'category_id', 'category_name', 'category_slug',
            'thumbnail_url', 'is_premium', 'price',
            'usage_count', 'rating', 'is_active'
        ]


class CVTemplateDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết mẫu CV
    """
    
    category = CVTemplateCategorySerializer(read_only=True)
    
    class Meta:
        model = CVTemplate
        fields = [
            'id', 'name', 'category',
            'thumbnail_url', 'preview_url', 'template_data',
            'is_premium', 'price', 'usage_count', 'rating',
            'is_active', 'created_at', 'updated_at'
        ]


class CVTemplateCreateSerializer(serializers.ModelSerializer):
    """
    Serializer cho tạo/cập nhật mẫu CV (Admin)
    """
    
    class Meta:
        model = CVTemplate
        fields = [
            'id', 'name', 'category', 
            'thumbnail_url', 'preview_url', 'template_data',
            'is_premium', 'price', 'is_active'
        ]
        read_only_fields = ['id']
