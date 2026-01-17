from rest_framework import serializers
from django.utils.text import slugify
from .models import Company
from apps.company.industries.models import Industry


class CompanySerializer(serializers.ModelSerializer):
    """Serializer cho đọc dữ liệu Company (List/Detail)"""
    industry_name = serializers.CharField(source='industry.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Company
        fields = [
            'id', 'company_name', 'slug', 'tax_code', 'company_size',
            'industry', 'industry_name', 'website', 'logo_url', 'banner_url',
            'description', 'address', 'founded_year', 'verification_status',
            'verified_at', 'follower_count', 'job_count',
            'user', 'user_email', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'verification_status', 'verified_at', 'verified_by',
            'follower_count', 'job_count', 'user', 'created_at', 'updated_at'
        ]


class CompanyCreateSerializer(serializers.Serializer):
    """Serializer cho tạo mới Company"""
    company_name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=255, required=False, allow_blank=True)
    tax_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    company_size = serializers.ChoiceField(
        choices=Company.CompanySize.choices,
        required=False,
        allow_blank=True
    )
    industry_id = serializers.IntegerField(required=False, allow_null=True)
    website = serializers.URLField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    founded_year = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_slug(self, value):
        """Kiểm tra slug unique nếu được cung cấp"""
        if value and Company.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug này đã tồn tại")
        return value
    
    def validate_industry_id(self, value):
        """Kiểm tra industry tồn tại"""
        if value and not Industry.objects.filter(id=value).exists():
            raise serializers.ValidationError("Ngành nghề không tồn tại")
        return value
    
    def validate_tax_code(self, value):
        """Kiểm tra tax_code unique nếu được cung cấp"""
        if value and Company.objects.filter(tax_code=value).exists():
            raise serializers.ValidationError("Mã số thuế đã được sử dụng")
        return value


class CompanyUpdateSerializer(serializers.Serializer):
    """Serializer cho cập nhật Company"""
    company_name = serializers.CharField(max_length=255, required=False)
    tax_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    company_size = serializers.ChoiceField(
        choices=Company.CompanySize.choices,
        required=False,
        allow_blank=True
    )
    industry_id = serializers.IntegerField(required=False, allow_null=True)
    website = serializers.URLField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    founded_year = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_industry_id(self, value):
        if value and not Industry.objects.filter(id=value).exists():
            raise serializers.ValidationError("Ngành nghề không tồn tại")
        return value
