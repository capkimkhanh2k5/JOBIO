from rest_framework import serializers
from .models import CompanyBenefit
from apps.company.benefit_categories.models import BenefitCategory


class CompanyBenefitSerializer(serializers.ModelSerializer):
    """Serializer cho đọc dữ liệu CompanyBenefit (List/Detail)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.URLField(source='category.icon_url', read_only=True)
    
    class Meta:
        model = CompanyBenefit
        fields = [
            'id', 'company', 'category', 'category_name', 'category_icon',
            'benefit_name', 'description', 'display_order', 'created_at'
        ]
        read_only_fields = ['id', 'company', 'created_at']


class CompanyBenefitCreateSerializer(serializers.Serializer):
    """Serializer cho tạo mới CompanyBenefit"""
    category_id = serializers.IntegerField()
    benefit_name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    display_order = serializers.IntegerField(required=False, allow_null=True, default=None)

    def validate_category_id(self, value):
        """Kiểm tra category tồn tại và đang active"""
        if not BenefitCategory.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Danh mục phúc lợi không tồn tại hoặc không hoạt động")
        return value


class CompanyBenefitUpdateSerializer(serializers.Serializer):
    """Serializer cho cập nhật CompanyBenefit"""
    category_id = serializers.IntegerField(required=False, allow_null=True)
    benefit_name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    display_order = serializers.IntegerField(required=False, allow_null=True)

    def validate_category_id(self, value):
        """Kiểm tra category tồn tại nếu được cung cấp"""
        if value is not None and not BenefitCategory.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Danh mục phúc lợi không tồn tại hoặc không hoạt động")
        return value


class BenefitReorderSerializer(serializers.Serializer):
    """Serializer cho sắp xếp lại thứ tự benefits"""
    benefit_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Danh sách benefit IDs theo thứ tự mới"
    )

    def validate_benefit_ids(self, value):
        """Kiểm tra danh sách không rỗng"""
        if not value:
            raise serializers.ValidationError("Danh sách benefit_ids không được trống")
        return value
